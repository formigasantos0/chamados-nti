from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.configuracao_sla import ConfiguracaoSLA
from app.models.feriado import Feriado
from app.models.politica_sla import PoliticaSLA


def _eh_dia_util(
    data: date,
    dias_uteis: set[int],
    feriados: set[date],
) -> bool:
    """
    Verifica se uma data é considerada dia útil.

    weekday():
    0 = segunda
    1 = terça
    2 = quarta
    3 = quinta
    4 = sexta
    5 = sábado
    6 = domingo
    """
    return data.weekday() in dias_uteis and data not in feriados


def _normalizar_inicio(
    momento: datetime,
    hora_inicio: time,
    hora_fim: time,
    dias_uteis: set[int],
    feriados: set[date],
) -> datetime:
    """
    Ajusta um momento para o próximo instante válido do expediente.
    """

    atual = momento

    while True:
        data_atual = atual.date()

        if not _eh_dia_util(data_atual, dias_uteis, feriados):
            proximo_dia = data_atual + timedelta(days=1)
            atual = datetime.combine(
                proximo_dia,
                hora_inicio,
                tzinfo=atual.tzinfo,
            )
            continue

        inicio_expediente = datetime.combine(
            data_atual,
            hora_inicio,
            tzinfo=atual.tzinfo,
        )

        fim_expediente = datetime.combine(
            data_atual,
            hora_fim,
            tzinfo=atual.tzinfo,
        )

        if atual < inicio_expediente:
            return inicio_expediente

        if atual >= fim_expediente:
            proximo_dia = data_atual + timedelta(days=1)
            atual = datetime.combine(
                proximo_dia,
                hora_inicio,
                tzinfo=atual.tzinfo,
            )
            continue

        return atual


def adicionar_minutos_uteis(
    inicio: datetime,
    minutos: int,
    hora_inicio: time,
    hora_fim: time,
    dias_uteis: set[int],
    feriados: set[date],
    timezone: str = "America/Sao_Paulo",
) -> datetime:
    """
    Soma minutos úteis a uma data/hora e retorna o vencimento do SLA.
    """

    if minutos < 0:
        raise ValueError("A quantidade de minutos não pode ser negativa.")

    tz = ZoneInfo(timezone)

    if inicio.tzinfo is None:
        inicio = inicio.replace(tzinfo=tz)
    else:
        inicio = inicio.astimezone(tz)

    atual = _normalizar_inicio(
        inicio,
        hora_inicio,
        hora_fim,
        dias_uteis,
        feriados,
    )

    restante = minutos

    while restante > 0:
        fim_expediente = datetime.combine(
            atual.date(),
            hora_fim,
            tzinfo=tz,
        )

        disponivel = int(
            (fim_expediente - atual).total_seconds() // 60
        )

        if restante <= disponivel:
            return atual + timedelta(minutes=restante)

        restante -= disponivel

        atual = _normalizar_inicio(
            datetime.combine(
                atual.date() + timedelta(days=1),
                hora_inicio,
                tzinfo=tz,
            ),
            hora_inicio,
            hora_fim,
            dias_uteis,
            feriados,
        )

    return atual


def calcular_minutos_uteis(
    inicio: datetime,
    fim: datetime,
    hora_inicio: time,
    hora_fim: time,
    dias_uteis: set[int],
    feriados: set[date],
    timezone: str = "America/Sao_Paulo",
) -> int:
    """
    Calcula quantos minutos úteis transcorreram entre dois momentos.
    """

    if fim < inicio:
        raise ValueError("O fim não pode ser anterior ao início.")

    tz = ZoneInfo(timezone)

    if inicio.tzinfo is None:
        inicio = inicio.replace(tzinfo=tz)
    else:
        inicio = inicio.astimezone(tz)

    if fim.tzinfo is None:
        fim = fim.replace(tzinfo=tz)
    else:
        fim = fim.astimezone(tz)

    total = 0
    data_atual = inicio.date()

    while data_atual <= fim.date():

        if _eh_dia_util(data_atual, dias_uteis, feriados):

            inicio_expediente = datetime.combine(
                data_atual,
                hora_inicio,
                tzinfo=tz,
            )

            fim_expediente = datetime.combine(
                data_atual,
                hora_fim,
                tzinfo=tz,
            )

            inicio_intervalo = max(inicio, inicio_expediente)
            fim_intervalo = min(fim, fim_expediente)

            if fim_intervalo > inicio_intervalo:
                total += int(
                    (fim_intervalo - inicio_intervalo).total_seconds() // 60
                )

        data_atual += timedelta(days=1)

    return total

def carregar_configuracao_sla(db: Session) -> ConfiguracaoSLA:
    """
    Carrega a configuração de calendário utilizada pelo SLA.
    """

    configuracao = db.scalar(
        select(ConfiguracaoSLA)
        .order_by(ConfiguracaoSLA.id)
        .limit(1)
    )

    if configuracao is None:
        raise RuntimeError(
            "Nenhuma configuração de SLA foi encontrada."
        )

    return configuracao


def carregar_politica_sla(
    db: Session,
    prioridade: str,
) -> PoliticaSLA:
    """
    Carrega a política ativa correspondente à prioridade do chamado.
    """

    politica = db.scalar(
        select(PoliticaSLA).where(
            PoliticaSLA.prioridade == prioridade.lower(),
            PoliticaSLA.ativo.is_(True),
        )
    )

    if politica is None:
        raise RuntimeError(
            f"Nenhuma política de SLA ativa para a prioridade '{prioridade}'."
        )

    return politica


def carregar_feriados(db: Session) -> set[date]:
    """
    Retorna as datas dos feriados ativos.
    """

    feriados = db.scalars(
        select(Feriado.data).where(
            Feriado.ativo.is_(True)
        )
    ).all()

    return set(feriados)


def obter_dias_uteis(
    configuracao: ConfiguracaoSLA,
) -> set[int]:
    """
    Converte a configuração semanal para os índices usados por weekday().

    0 = segunda
    ...
    6 = domingo
    """

    dias = {
        0: configuracao.segunda,
        1: configuracao.terca,
        2: configuracao.quarta,
        3: configuracao.quinta,
        4: configuracao.sexta,
        5: configuracao.sabado,
        6: configuracao.domingo,
    }

    return {
        numero
        for numero, ativo in dias.items()
        if ativo
    }

def classificar_sla(
    consumido_minutos: int,
    limite_minutos: int,
    concluido: bool,
) -> tuple[str, float]:
    """
    Classifica a situação do SLA e calcula o percentual consumido.
    """

    if limite_minutos <= 0:
        raise ValueError("O limite do SLA deve ser maior que zero.")

    percentual = round(
        (consumido_minutos / limite_minutos) * 100,
        1,
    )

    if concluido:
        situacao = (
            "cumprido"
            if consumido_minutos <= limite_minutos
            else "violado"
        )
    else:
        if consumido_minutos > limite_minutos:
            situacao = "violado"
        elif percentual >= 80:
            situacao = "proximo_do_vencimento"
        else:
            situacao = "dentro_do_prazo"

    return situacao, percentual

def calcular_sla_chamado(
    db: Session,
    chamado,
    agora: datetime | None = None,
) -> dict:
    """
    Calcula a situação de SLA de primeiro atendimento e resolução
    para um chamado.
    """

    configuracao = carregar_configuracao_sla(db)
    politica = carregar_politica_sla(db, chamado.prioridade)
    feriados = carregar_feriados(db)
    dias_uteis = obter_dias_uteis(configuracao)

    if agora is None:
        agora = datetime.now(ZoneInfo(configuracao.timezone))

    # ---------------------------------------------------------
    # Primeiro atendimento
    # ---------------------------------------------------------

    fim_primeiro_atendimento = (
        chamado.primeiro_atendimento_em
        if chamado.primeiro_atendimento_em is not None
        else agora
    )

    minutos_primeiro_atendimento = calcular_minutos_uteis(
        inicio=chamado.criado_em,
        fim=fim_primeiro_atendimento,
        hora_inicio=configuracao.hora_inicio,
        hora_fim=configuracao.hora_fim,
        dias_uteis=dias_uteis,
        feriados=feriados,
        timezone=configuracao.timezone,
    )

    prazo_primeiro_atendimento = adicionar_minutos_uteis(
        inicio=chamado.criado_em,
        minutos=politica.primeiro_atendimento_minutos,
        hora_inicio=configuracao.hora_inicio,
        hora_fim=configuracao.hora_fim,
        dias_uteis=dias_uteis,
        feriados=feriados,
        timezone=configuracao.timezone,
    )

    primeiro_atendimento_cumprido = (
        minutos_primeiro_atendimento
        <= politica.primeiro_atendimento_minutos
    )

    situacao_primeiro_atendimento, percentual_primeiro_atendimento = (
    classificar_sla(
        consumido_minutos=minutos_primeiro_atendimento,
        limite_minutos=politica.primeiro_atendimento_minutos,
        concluido=chamado.primeiro_atendimento_em is not None,
    )
)

    # ---------------------------------------------------------
    # Resolução
    # ---------------------------------------------------------

    fim_resolucao = (
        chamado.resolvido_em
        if chamado.resolvido_em is not None
        else agora
    )

    minutos_resolucao = calcular_minutos_uteis(
        inicio=chamado.criado_em,
        fim=fim_resolucao,
        hora_inicio=configuracao.hora_inicio,
        hora_fim=configuracao.hora_fim,
        dias_uteis=dias_uteis,
        feriados=feriados,
        timezone=configuracao.timezone,
    )

    prazo_resolucao = adicionar_minutos_uteis(
        inicio=chamado.criado_em,
        minutos=politica.resolucao_minutos,
        hora_inicio=configuracao.hora_inicio,
        hora_fim=configuracao.hora_fim,
        dias_uteis=dias_uteis,
        feriados=feriados,
        timezone=configuracao.timezone,
    )

    resolucao_cumprida = (
        minutos_resolucao
        <= politica.resolucao_minutos
    )

    situacao_resolucao, percentual_resolucao = classificar_sla(
    consumido_minutos=minutos_resolucao,
    limite_minutos=politica.resolucao_minutos,
    concluido=chamado.resolvido_em is not None,
)

    return {
        "prioridade": chamado.prioridade,

        "primeiro_atendimento": {
            "limite_minutos": politica.primeiro_atendimento_minutos,
            "consumido_minutos": minutos_primeiro_atendimento,
            "prazo": prazo_primeiro_atendimento,
            "realizado_em": chamado.primeiro_atendimento_em,
            "cumprido": primeiro_atendimento_cumprido,
            "percentual_consumido": percentual_primeiro_atendimento,
            "situacao": situacao_primeiro_atendimento,
        },

        "resolucao": {
            "limite_minutos": politica.resolucao_minutos,
            "consumido_minutos": minutos_resolucao,
            "prazo": prazo_resolucao,
            "realizado_em": chamado.resolvido_em,
            "cumprido": resolucao_cumprida,
            "percentual_consumido": percentual_resolucao,
            "situacao": situacao_resolucao,

        },
    }