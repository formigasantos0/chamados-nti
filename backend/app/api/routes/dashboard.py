from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_equipe_nti_atual
from app.db.session import get_db
from app.models.chamado import Chamado
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from app.services.sla import calcular_sla_chamado
from app.schemas.dashboard import (
    DashboardMetricas,
    DashboardResumo,
    DashboardSLA,
    MetricaItem,
    SLAIndicadorResumo,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/resumo", response_model=DashboardResumo)
def obter_resumo_dashboard(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_equipe_nti_atual),
):
    def contar(*condicoes) -> int:
        consulta = select(func.count(Chamado.id))

        if condicoes:
            consulta = consulta.where(*condicoes)

        return db.scalar(consulta) or 0

    return DashboardResumo(
        total=contar(),
        abertos=contar(Chamado.status == "aberto"),
        em_atendimento=contar(
            Chamado.status == "em_atendimento"
        ),
        aguardando_usuario=contar(
            Chamado.status == "aguardando_usuario"
        ),
        resolvidos=contar(
            Chamado.status == "resolvido"
        ),
        fechados=contar(
            Chamado.status == "fechado"
        ),
        urgentes=contar(
            Chamado.prioridade == "urgente",
            Chamado.status.notin_(["resolvido", "fechado"]),
        ),
        sem_responsavel=contar(
            Chamado.responsavel_id.is_(None),
            Chamado.status.notin_(["resolvido", "fechado"]),
        ),
    )

@router.get("/metricas", response_model=DashboardMetricas)
def obter_metricas_dashboard(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_equipe_nti_atual),
):
    status_resultado = db.execute(
        select(
            Chamado.status,
            func.count(Chamado.id),
        )
        .group_by(Chamado.status)
        .order_by(Chamado.status)
    ).all()

    prioridade_resultado = db.execute(
        select(
            Chamado.prioridade,
            func.count(Chamado.id),
        )
        .group_by(Chamado.prioridade)
        .order_by(Chamado.prioridade)
    ).all()

    categoria_resultado = db.execute(
        select(
            Categoria.nome,
            func.count(Chamado.id),
        )
        .join(Chamado, Chamado.categoria_id == Categoria.id)
        .group_by(Categoria.id, Categoria.nome)
        .order_by(func.count(Chamado.id).desc(), Categoria.nome)
    ).all()

    responsavel_resultado = db.execute(
        select(
            Usuario.nome,
            func.count(Chamado.id),
        )
        .join(Chamado, Chamado.responsavel_id == Usuario.id)
        .group_by(Usuario.id, Usuario.nome)
        .order_by(func.count(Chamado.id).desc(), Usuario.nome)
    ).all()

    sem_responsavel = db.scalar(
        select(func.count(Chamado.id)).where(
            Chamado.responsavel_id.is_(None)
        )
    ) or 0

    return DashboardMetricas(
        por_status=[
            MetricaItem(nome=status, quantidade=quantidade)
            for status, quantidade in status_resultado
        ],
        por_prioridade=[
            MetricaItem(nome=prioridade, quantidade=quantidade)
            for prioridade, quantidade in prioridade_resultado
        ],
        por_categoria=[
            MetricaItem(nome=nome, quantidade=quantidade)
            for nome, quantidade in categoria_resultado
        ],
        por_responsavel=[
            *[
                MetricaItem(nome=nome, quantidade=quantidade)
                for nome, quantidade in responsavel_resultado
            ],
            MetricaItem(
                nome="Não atribuído",
                quantidade=sem_responsavel,
            ),
        ],
    )

@router.get("/sla", response_model=DashboardSLA)
def obter_sla_dashboard(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_equipe_nti_atual),
):
    primeiro_atendimento = {
        "dentro_do_prazo": 0,
        "proximo_do_vencimento": 0,
        "cumprido": 0,
        "violado": 0,
    }

    resolucao = {
        "dentro_do_prazo": 0,
        "proximo_do_vencimento": 0,
        "cumprido": 0,
        "violado": 0,
    }

    chamados = db.scalars(
        select(Chamado).order_by(Chamado.id)
    ).all()

    for chamado in chamados:
        sla = calcular_sla_chamado(db, chamado)

        situacao_primeiro = sla["primeiro_atendimento"]["situacao"]
        situacao_resolucao = sla["resolucao"]["situacao"]

        primeiro_atendimento[situacao_primeiro] += 1
        resolucao[situacao_resolucao] += 1

    return DashboardSLA(
        primeiro_atendimento=SLAIndicadorResumo(
            **primeiro_atendimento
        ),
        resolucao=SLAIndicadorResumo(
            **resolucao
        ),
    )