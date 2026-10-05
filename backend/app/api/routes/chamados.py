import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_equipe_nti_atual, get_usuario_atual
from app.core.config import settings
from app.db.session import get_db
from app.models.categoria import Categoria
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
from app.services.email_service import enviar_email
from app.services.email_templates import (
    template_chamado_atribuido,
    template_chamado_recebido,
    template_nova_interacao,
    template_novo_chamado,
    template_status_chamado,
)
from app.services.sla import calcular_sla_chamado


logger = logging.getLogger(__name__)

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
    prioridade = "normal"

    categoria = db.get(Categoria, dados.categoria_id)

    if categoria is None or not categoria.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria inválida ou inativa",
        )

    chamado = Chamado(
        protocolo=f"TEMP-{uuid4().hex[:16]}",
        titulo=dados.titulo.strip(),
        descricao=dados.descricao.strip(),
        categoria_id=categoria.id,
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
            selectinload(Chamado.categoria),
        )
        .where(Chamado.id == chamado.id)
    )

    try:
        corpo_texto, corpo_html = template_novo_chamado(
            protocolo=chamado.protocolo,
            solicitante_nome=chamado.solicitante.nome,
            solicitante_email=chamado.solicitante.email,
            unidade=chamado.unidade.nome,
            categoria=chamado.categoria.nome,
            assunto=chamado.titulo,
        )

        enviar_email(
            destinatario=settings.notificacao_nti_email,
            assunto=f"Novo chamado {chamado.protocolo} - {chamado.titulo}",
            corpo=corpo_texto,
            html=corpo_html,
        )

        corpo_usuario_texto, corpo_usuario_html = template_chamado_recebido(
            protocolo=chamado.protocolo,
            solicitante_nome=chamado.solicitante.nome,
            categoria=chamado.categoria.nome,
            assunto=chamado.titulo,
            chamado_id=chamado.id,
            app_url=settings.app_url,
        )

        enviar_email(
            destinatario=chamado.solicitante.email,
            assunto=f"[{chamado.protocolo}] Chamado recebido",
            corpo=corpo_usuario_texto,
            html=corpo_usuario_html,
        )

    except Exception:
        logger.exception(
            "Falha ao enviar notificação do chamado %s",
            chamado.protocolo,
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
    # Técnico e administrador enxergam todos.
    if usuario.perfil not in {"tecnico", "administrador"}:
        consulta = consulta.where(
            Chamado.solicitante_id == usuario.id
        )

    chamados = db.scalars(consulta).all()

    resultado = []

    for chamado in chamados:
        dados = ChamadoResponse.model_validate(chamado)

        sla_calculado = calcular_sla_chamado(
            db=db,
            chamado=chamado,
        )

        dados.sla = {
            "primeiro_atendimento": {
                "situacao": sla_calculado["primeiro_atendimento"]["situacao"],
                "percentual_consumido": sla_calculado["primeiro_atendimento"][
                    "percentual_consumido"
                ],
                "prazo": sla_calculado["primeiro_atendimento"]["prazo"],
            },
            "resolucao": {
                "situacao": sla_calculado["resolucao"]["situacao"],
                "percentual_consumido": sla_calculado["resolucao"][
                    "percentual_consumido"
                ],
                "prazo": sla_calculado["resolucao"]["prazo"],
            },
        }

        resultado.append(dados)

    return resultado


# ============================================================
# CONSULTAR CHAMADO
# GET /chamados/{chamado_id}
# ============================================================

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
            selectinload(Chamado.categoria),
            selectinload(Chamado.responsavel),
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


# ============================================================
# ATUALIZAR CHAMADO
# PATCH /chamados/{chamado_id}
# ============================================================

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

    # Guarda o novo responsável somente quando houver
    # uma atribuição/troca real. Isso impede e-mails duplicados.
    novo_responsavel = None

    # Guarda somente mudanças de status que devem gerar
    # notificação para o solicitante após o commit.
    status_para_notificar = None

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

        transicoes_permitidas = {
            "aberto": {
                "em_atendimento",
            },
            "em_atendimento": {
                "aguardando_usuario",
                "resolvido",
            },
            "aguardando_usuario": {
                "em_atendimento",
                "resolvido",
            },
            "resolvido": {
                "em_atendimento",
                "fechado",
            },
            "fechado": set(),
        }

        novo_status = dados.status.lower()
        status_anterior = chamado.status

        if novo_status not in status_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status inválido",
            )

        if status_anterior not in status_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O chamado possui um status atual inválido",
            )

        if status_anterior != novo_status:
            if novo_status not in transicoes_permitidas[status_anterior]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Transição de status não permitida: "
                        f"'{status_anterior}' → '{novo_status}'"
                    ),
                )

            agora = datetime.now(timezone.utc)

            chamado.status = novo_status

            if novo_status in {
                "aguardando_usuario",
                "resolvido",
                "fechado",
            }:
                status_para_notificar = novo_status

            # Primeiro atendimento é registrado somente uma vez.
            if (
                novo_status == "em_atendimento"
                and chamado.primeiro_atendimento_em is None
            ):
                chamado.primeiro_atendimento_em = agora

            # Ao resolver, registra o momento da resolução.
            if novo_status == "resolvido":
                chamado.resolvido_em = agora

            # Ao reabrir um chamado resolvido, ele deixa de estar resolvido.
            if (
                status_anterior == "resolvido"
                and novo_status == "em_atendimento"
            ):
                chamado.resolvido_em = None

            # Ao fechar, registra o momento do fechamento.
            if novo_status == "fechado":
                chamado.fechado_em = agora

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

    if "responsavel_id" in dados.model_fields_set:
        responsavel_anterior_id = chamado.responsavel_id

        # Remover responsável
        if dados.responsavel_id is None:
            if responsavel_anterior_id is not None:
                chamado.responsavel_id = None

                historicos.append(
                    HistoricoChamado(
                        chamado_id=chamado.id,
                        usuario_id=usuario.id,
                        tipo="remocao_responsavel",
                        descricao="Responsável removido do chamado.",
                    )
                )

        # Atribuir ou trocar responsável
        else:
            responsavel = db.get(
                Usuario,
                dados.responsavel_id,
            )

            if (
                responsavel is None
                or not responsavel.ativo
                or responsavel.perfil not in {"tecnico", "administrador"}
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Responsável deve ser um técnico "
                        "ou administrador ativo"
                    ),
                )

            # Só considera nova atribuição quando o responsável
            # realmente mudou.
            if responsavel_anterior_id != responsavel.id:
                chamado.responsavel_id = responsavel.id
                novo_responsavel = responsavel

                historicos.append(
                    HistoricoChamado(
                        chamado_id=chamado.id,
                        usuario_id=usuario.id,
                        tipo="atribuicao_responsavel",
                        descricao=(
                            f"Chamado atribuído a "
                            f"{responsavel.nome}."
                        ),
                    )
                )

    # Salva alteração do chamado e histórico
    # na mesma transação.
    db.add_all(historicos)
    db.commit()

    # Recarrega o chamado com todos os relacionamentos
    # necessários para resposta e notificações.
    chamado = db.scalar(
        select(Chamado)
        .options(
            selectinload(Chamado.solicitante),
            selectinload(Chamado.unidade),
            selectinload(Chamado.responsavel),
            selectinload(Chamado.categoria),
        )
        .where(Chamado.id == chamado.id)
    )

    # --------------------------------------------------------
    # NOTIFICAÇÃO DE ATRIBUIÇÃO
    # --------------------------------------------------------

    if novo_responsavel is not None:
        try:
            corpo_texto, corpo_html = template_chamado_atribuido(
                protocolo=chamado.protocolo,
                tecnico_nome=novo_responsavel.nome,
                solicitante_nome=chamado.solicitante.nome,
                unidade=chamado.unidade.nome,
                categoria=chamado.categoria.nome,
                assunto=chamado.titulo,
                prioridade=chamado.prioridade,
                chamado_id=chamado.id,
                app_url=settings.app_url,
            )

            enviar_email(
                destinatario=novo_responsavel.email,
                assunto=f"[{chamado.protocolo}] Chamado atribuído a você",
                corpo=corpo_texto,
                html=corpo_html,
            )

        except Exception:
            logger.exception(
                "Falha ao enviar notificação de atribuição do chamado %s",
                chamado.protocolo,
            )

                # --------------------------------------------------------
    # NOTIFICAÇÃO DE ATRIBUIÇÃO
    # --------------------------------------------------------

    if novo_responsavel is not None:
        try:
            corpo_texto, corpo_html = template_chamado_atribuido(
                protocolo=chamado.protocolo,
                tecnico_nome=novo_responsavel.nome,
                solicitante_nome=chamado.solicitante.nome,
                unidade=chamado.unidade.nome,
                categoria=chamado.categoria.nome,
                assunto=chamado.titulo,
                prioridade=chamado.prioridade,
                chamado_id=chamado.id,
                app_url=settings.app_url,
            )

            enviar_email(
                destinatario=novo_responsavel.email,
                assunto=f"[{chamado.protocolo}] Chamado atribuído a você",
                corpo=corpo_texto,
                html=corpo_html,
            )

        except Exception:
            logger.exception(
                "Falha ao enviar notificação de atribuição do chamado %s",
                chamado.protocolo,
            )

    # --------------------------------------------------------
    # NOTIFICAÇÃO DE ALTERAÇÃO DE STATUS
    # --------------------------------------------------------

    if status_para_notificar is not None:
        try:
            corpo_texto, corpo_html = template_status_chamado(
                protocolo=chamado.protocolo,
                solicitante_nome=chamado.solicitante.nome,
                assunto=chamado.titulo,
                novo_status=status_para_notificar,
                chamado_id=chamado.id,
                app_url=settings.app_url,
            )

            assuntos_status = {
                "aguardando_usuario": (
                    f"[{chamado.protocolo}] Aguardando sua resposta"
                ),
                "resolvido": (
                    f"[{chamado.protocolo}] Chamado resolvido"
                ),
                "fechado": (
                    f"[{chamado.protocolo}] Chamado fechado"
                ),
            }

            enviar_email(
                destinatario=chamado.solicitante.email,
                assunto=assuntos_status[status_para_notificar],
                corpo=corpo_texto,
                html=corpo_html,
            )

        except Exception:
            logger.exception(
                "Falha ao enviar notificação de status do chamado %s",
                chamado.protocolo,
            )

    return chamado

    return chamado


# ============================================================
# ADICIONAR MENSAGEM / INTERAÇÃO
# POST /chamados/{chamado_id}/mensagens
# ============================================================

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

    try:
        # Técnico ou administrador respondeu:
        # notifica o solicitante.
        if usuario.perfil in {"tecnico", "administrador"}:
            destinatario_email = chamado.solicitante.email
            destinatario_nome = chamado.solicitante.nome

        # Solicitante respondeu:
        # notifica o responsável ou, se ainda não houver,
        # a caixa geral do NTI.
        elif chamado.responsavel is not None:
            destinatario_email = chamado.responsavel.email
            destinatario_nome = chamado.responsavel.nome

        else:
            destinatario_email = settings.notificacao_nti_email
            destinatario_nome = "Equipe NTI"

        corpo_texto, corpo_html = template_nova_interacao(
            protocolo=chamado.protocolo,
            destinatario_nome=destinatario_nome,
            autor_nome=usuario.nome,
            assunto=chamado.titulo,
            mensagem=mensagem.descricao,
            chamado_id=chamado.id,
            app_url=settings.app_url,
        )

        enviar_email(
            destinatario=destinatario_email,
            assunto=f"[{chamado.protocolo}] Nova interação",
            corpo=corpo_texto,
            html=corpo_html,
        )

    except Exception:
        logger.exception(
            "Falha ao enviar notificação de interação do chamado %s",
            chamado.protocolo,
        )

    return mensagem


# ============================================================
# HISTÓRICO
# GET /chamados/{chamado_id}/historico
# ============================================================

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