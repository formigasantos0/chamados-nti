from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_equipe_nti_atual, get_usuario_atual
from app.db.session import get_db
from app.models.chamado import Chamado
from app.models.historico import HistoricoChamado
from app.models.usuario import Usuario
from app.schemas.chamado import (
    ChamadoAtualizar,
    ChamadoCriar,
    ChamadoResponse,
    HistoricoResponse,
    MensagemCriar,
    MensagemResponse,
)



router = APIRouter(
    prefix="/chamados",
    tags=["Chamados"],
)

# ============================================================
# CRIAR CHAMADO
# POST /chamados/
# ============================================================

@router.post(
    "/",
    response_model=ChamadoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_chamado(
    dados: ChamadoCriar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    prioridades_validas = {
        "baixa",
        "normal",
        "alta",
        "urgente",
    }



    prioridade = dados.prioridade.lower()

    if prioridade not in prioridades_validas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prioridade inválida",
        )

    chamado = Chamado(
        protocolo="TEMP",
        titulo=dados.titulo.strip(),
        descricao=dados.descricao.strip(),
        categoria=dados.categoria.strip(),
        prioridade=prioridade,
        status="aberto",
        solicitante_id=usuario.id,
        unidade_id=usuario.unidade_id,
    )

    db.add(chamado)
    db.flush()

    ano = datetime.now(timezone.utc).year
    chamado.protocolo = f"CH-{ano}-{chamado.id:06d}"

    historico = HistoricoChamado(
    chamado_id=chamado.id,
    usuario_id=usuario.id,
    tipo="abertura",
    descricao="Chamado aberto pelo usuário.",
)

    db.add(historico)
    db.commit()

    chamado = db.scalar(
        select(Chamado)
        .options(
            selectinload(Chamado.solicitante),
            selectinload(Chamado.unidade),
        )
        .where(Chamado.id == chamado.id)
    )

    return chamado

# ============================================================
# LISTAR CHAMADOS
# GET /chamados/
# ============================================================

@router.get(
    "/",
    response_model=list[ChamadoResponse],
)
def listar_chamados(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    consulta = (
        select(Chamado)
        .options(
            selectinload(Chamado.solicitante),
            selectinload(Chamado.unidade),
        )
        .order_by(Chamado.criado_em.desc())
    )

    # Usuário comum enxerga somente os próprios chamados.
    # Administrador enxerga todos.

    if usuario.perfil not in {"tecnico", "administrador"}:
        consulta = consulta.where(
            Chamado.solicitante_id == usuario.id
    )

    chamados = db.scalars(consulta).all()

    return chamados

    # Usuário comum enxerga somente os próprios chamados.
    # Administrador enxerga todos.

@router.get(
    "/{chamado_id}",
    response_model=ChamadoResponse,
)
def consultar_chamado(
    chamado_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    chamado = db.scalar(
        select(Chamado)
        .options(
            selectinload(Chamado.solicitante),
            selectinload(Chamado.unidade),
        )
        .where(Chamado.id == chamado_id)
    )

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    if (
        usuario.perfil not in {"tecnico", "administrador"}
        and chamado.solicitante_id != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui permissão para acessar este chamado",
        )

    return chamado

@router.patch(
    "/{chamado_id}",
    response_model=ChamadoResponse,
)
def atualizar_chamado(
    chamado_id: int,
    dados: ChamadoAtualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_equipe_nti_atual),
):

    chamado = db.get(Chamado, chamado_id)

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    historicos = []

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if dados.status is not None:
        status_validos = {
            "aberto",
            "em_atendimento",
            "aguardando_usuario",
            "resolvido",
            "fechado",
        }

        novo_status = dados.status.lower()

        if novo_status not in status_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status inválido",
            )

        status_anterior = chamado.status

        if status_anterior != novo_status:
            chamado.status = novo_status

            historicos.append(
                HistoricoChamado(
                    chamado_id=chamado.id,
                    usuario_id=usuario.id,
                    tipo="alteracao_status",
                    descricao=(
                        f"Status alterado de "
                        f"'{status_anterior}' para '{novo_status}'."
                    ),
                )
            )

    # --------------------------------------------------------
    # PRIORIDADE
    # --------------------------------------------------------

    if dados.prioridade is not None:
        prioridades_validas = {
            "baixa",
            "normal",
            "alta",
            "urgente",
        }

        nova_prioridade = dados.prioridade.lower()

        if nova_prioridade not in prioridades_validas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prioridade inválida",
            )

        prioridade_anterior = chamado.prioridade

        if prioridade_anterior != nova_prioridade:
            chamado.prioridade = nova_prioridade

            historicos.append(
                HistoricoChamado(
                    chamado_id=chamado.id,
                    usuario_id=usuario.id,
                    tipo="alteracao_prioridade",
                    descricao=(
                        f"Prioridade alterada de "
                        f"'{prioridade_anterior}' para '{nova_prioridade}'."
                    ),
                )
            )

    # --------------------------------------------------------
    # RESPONSÁVEL
    # --------------------------------------------------------

    if dados.responsavel_id is not None:
        responsavel = db.get(Usuario, dados.responsavel_id)

        if (
            responsavel is None
            or not responsavel.ativo
            or responsavel.perfil not in {"tecnico", "administrador"}
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Responsável deve ser um técnico ou administrador ativo",
        )

        responsavel_anterior_id = chamado.responsavel_id

        if responsavel_anterior_id != responsavel.id:
            chamado.responsavel_id = responsavel.id

            historicos.append(
                HistoricoChamado(
                    chamado_id=chamado.id,
                    usuario_id=usuario.id,
                    tipo="atribuicao_responsavel",
                    descricao=f"Chamado atribuído a {responsavel.nome}.",
                )
            )

    # Salva a alteração do chamado e o histórico
    # dentro da mesma transação.
    db.add_all(historicos)
    db.commit()

    chamado = db.scalar(
        select(Chamado)
        .options(
            selectinload(Chamado.solicitante),
            selectinload(Chamado.unidade),
        )
        .where(Chamado.id == chamado.id)
    )

    return chamado

@router.post(
    "/{chamado_id}/mensagens",
    response_model=MensagemResponse,
    status_code=status.HTTP_201_CREATED,
)
def adicionar_mensagem(
    chamado_id: int,
    dados: MensagemCriar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    chamado = db.get(Chamado, chamado_id)

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    # Usuário comum só pode responder aos próprios chamados.
    if (
        usuario.perfil not in {"tecnico", "administrador"}
        and chamado.solicitante_id != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui permissão para responder este chamado",
        )

    # Chamado fechado não recebe novas mensagens.
    if chamado.status == "fechado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível responder a um chamado fechado",
        )

    mensagem = HistoricoChamado(
        chamado_id=chamado.id,
        usuario_id=usuario.id,
        tipo="mensagem",
        descricao=dados.mensagem.strip(),
    )

    db.add(mensagem)
    db.commit()
    db.refresh(mensagem)

    return mensagem

@router.get(
    "/{chamado_id}/historico",
    response_model=list[HistoricoResponse],
)
def listar_historico_chamado(
    chamado_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    chamado = db.get(Chamado, chamado_id)

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    if (
        usuario.perfil not in {"tecnico", "administrador"}
        and chamado.solicitante_id != usuario.id
    ):
        raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Você não possui permissão para acessar este chamado",
    )

    historicos = db.scalars(
        select(HistoricoChamado)
        .options(
            selectinload(HistoricoChamado.usuario)
        )
        .where(HistoricoChamado.chamado_id == chamado_id)
        .order_by(HistoricoChamado.criado_em.asc())
    ).all()

    return historicos