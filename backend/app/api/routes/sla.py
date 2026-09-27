from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_admin_atual
from app.db.session import get_db
from app.models.configuracao_sla import ConfiguracaoSLA
from app.models.feriado import Feriado
from app.models.politica_sla import PoliticaSLA
from app.models.usuario import Usuario
from app.schemas.sla import (
    ConfiguracaoSLAAtualizar,
    ConfiguracaoSLAResponse,
    FeriadoAtualizar,
    FeriadoCriar,
    FeriadoResponse,
    PoliticaSLAAtualizar,
    PoliticaSLAResponse,
)


router = APIRouter(
    prefix="/sla",
    tags=["SLA"],
)


# ============================================================
# POLÍTICAS DE SLA
# ============================================================


@router.get(
    "/politicas",
    response_model=list[PoliticaSLAResponse],
)
def listar_politicas_sla(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    return db.scalars(
        select(PoliticaSLA).order_by(PoliticaSLA.id)
    ).all()


@router.patch(
    "/politicas/{politica_id}",
    response_model=PoliticaSLAResponse,
)
def atualizar_politica_sla(
    politica_id: int,
    dados: PoliticaSLAAtualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    politica = db.get(PoliticaSLA, politica_id)

    if politica is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Política de SLA não encontrada",
        )

    if dados.primeiro_atendimento_minutos is not None:
        politica.primeiro_atendimento_minutos = (
            dados.primeiro_atendimento_minutos
        )

    if dados.resolucao_minutos is not None:
        politica.resolucao_minutos = dados.resolucao_minutos

    if dados.ativo is not None:
        politica.ativo = dados.ativo

    db.commit()
    db.refresh(politica)

    return politica


# ============================================================
# CONFIGURAÇÃO DO CALENDÁRIO DE SLA
# ============================================================


@router.get(
    "/configuracao",
    response_model=ConfiguracaoSLAResponse,
)
def obter_configuracao_sla(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    configuracao = db.scalar(
        select(ConfiguracaoSLA).order_by(ConfiguracaoSLA.id)
    )

    if configuracao is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração de SLA não encontrada",
        )

    return configuracao


@router.patch(
    "/configuracao",
    response_model=ConfiguracaoSLAResponse,
)
def atualizar_configuracao_sla(
    dados: ConfiguracaoSLAAtualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    configuracao = db.scalar(
        select(ConfiguracaoSLA).order_by(ConfiguracaoSLA.id)
    )

    if configuracao is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração de SLA não encontrada",
        )

    valores = dados.model_dump(exclude_unset=True)

    if "timezone" in valores:
        try:
            ZoneInfo(valores["timezone"])
        except ZoneInfoNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Timezone inválido",
            )

    hora_inicio = valores.get(
        "hora_inicio",
        configuracao.hora_inicio,
    )
    hora_fim = valores.get(
        "hora_fim",
        configuracao.hora_fim,
    )

    if hora_inicio >= hora_fim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A hora inicial deve ser anterior à hora final",
        )

    campos_dias = (
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
        "domingo",
    )

    dias_resultantes = [
        valores.get(campo, getattr(configuracao, campo))
        for campo in campos_dias
    ]

    if not any(dias_resultantes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pelo menos um dia da semana deve estar ativo",
        )

    for campo, valor in valores.items():
        setattr(configuracao, campo, valor)

    db.commit()
    db.refresh(configuracao)

    return configuracao


# ============================================================
# FERIADOS
# ============================================================


@router.get(
    "/feriados",
    response_model=list[FeriadoResponse],
)
def listar_feriados(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    return db.scalars(
        select(Feriado).order_by(Feriado.data)
    ).all()


@router.post(
    "/feriados",
    response_model=FeriadoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_feriado(
    dados: FeriadoCriar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    existente = db.scalar(
        select(Feriado).where(Feriado.data == dados.data)
    )

    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um feriado cadastrado nesta data",
        )

    nome = dados.nome.strip()

    if len(nome) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome do feriado deve possuir pelo menos 2 caracteres",
        )

    feriado = Feriado(
        data=dados.data,
        nome=nome,
        ativo=True,
    )

    db.add(feriado)
    db.commit()
    db.refresh(feriado)

    return feriado


@router.patch(
    "/feriados/{feriado_id}",
    response_model=FeriadoResponse,
)
def atualizar_feriado(
    feriado_id: int,
    dados: FeriadoAtualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_admin_atual),
):
    feriado = db.get(Feriado, feriado_id)

    if feriado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feriado não encontrado",
        )

    if dados.data is not None and dados.data != feriado.data:
        existente = db.scalar(
            select(Feriado).where(
                Feriado.data == dados.data,
                Feriado.id != feriado_id,
            )
        )

        if existente is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um feriado cadastrado nesta data",
            )

        feriado.data = dados.data

    if dados.nome is not None:
        nome = dados.nome.strip()

        if len(nome) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O nome do feriado deve possuir pelo menos 2 caracteres",
            )

        feriado.nome = nome

    if dados.ativo is not None:
        feriado.ativo = dados.ativo

    db.commit()
    db.refresh(feriado)

    return feriado