from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import get_admin_atual, get_equipe_nti_atual
from app.core.security import gerar_hash_senha
from app.db.session import get_db
from app.models.unidade import UnidadeOrganizacional
from app.models.usuario import Usuario
from app.schemas.usuario import (
    UsuarioAtualizar,
    UsuarioCriar,
    UsuarioRedefinirSenha,
    UsuarioResponse,
)


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
)


@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    usuarios = db.scalars(
        select(Usuario)
        .options(selectinload(Usuario.unidade))
        .order_by(Usuario.nome)
    ).all()

    return usuarios

@router.get("/equipe-nti", response_model=list[UsuarioResponse])
def listar_equipe_nti(
    db: Session = Depends(get_db),
    equipe_nti: Usuario = Depends(get_equipe_nti_atual),
):
    usuarios = db.scalars(
        select(Usuario)
        .options(selectinload(Usuario.unidade))
        .where(
            Usuario.ativo.is_(True),
            Usuario.perfil.in_(["tecnico", "administrador"]),
        )
        .order_by(Usuario.nome)
    ).all()

    return usuarios


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def consultar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    usuario = db.scalar(
        select(Usuario)
        .options(selectinload(Usuario.unidade))
        .where(Usuario.id == usuario_id)
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    return usuario

@router.patch("/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioAtualizar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    usuario = db.scalar(
        select(Usuario)
        .options(selectinload(Usuario.unidade))
        .where(Usuario.id == usuario_id)
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    if dados.nome is not None:
        usuario.nome = dados.nome.strip()

    if dados.email is not None:
        email = dados.email.lower()

        usuario_email_existente = db.scalar(
            select(Usuario).where(
                Usuario.email == email,
                Usuario.id != usuario.id,
            )
        )

        if usuario_email_existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um usuário com esse e-mail",
            )

        usuario.email = email

    if dados.unidade_id is not None:
        unidade = db.get(
            UnidadeOrganizacional,
            dados.unidade_id,
        )

        if unidade is None or not unidade.ativo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unidade organizacional inválida",
            )

        usuario.unidade_id = unidade.id

    if dados.perfil is not None:
        if dados.perfil not in {
            "usuario",
            "tecnico",
            "administrador",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Perfil inválido",
            )

        if (
            usuario.id == admin.id
            and dados.perfil != "administrador"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Você não pode remover o perfil de "
                    "administrador da própria conta"
                ),
            )

        usuario.perfil = dados.perfil

    if dados.ativo is not None:
        if usuario.id == admin.id and not dados.ativo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode desativar a própria conta",
            )

        usuario.ativo = dados.ativo

    db.commit()

    usuario = db.scalar(
        select(Usuario)
        .options(selectinload(Usuario.unidade))
        .where(Usuario.id == usuario_id)
    )

    return usuario

@router.post(
    "/{usuario_id}/redefinir-senha",
    status_code=status.HTTP_204_NO_CONTENT,
)
def redefinir_senha_usuario(
    usuario_id: int,
    dados: UsuarioRedefinirSenha,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    usuario = db.get(Usuario, usuario_id)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    usuario.senha_hash = gerar_hash_senha(dados.senha)

    db.commit()


@router.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_usuario(
    dados: UsuarioCriar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    email = dados.email.lower()

    usuario_existente = db.scalar(
        select(Usuario).where(Usuario.email == email)
    )

    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um usuário com esse e-mail",
        )

    unidade = db.get(
        UnidadeOrganizacional,
        dados.unidade_id,
    )

    if unidade is None or not unidade.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unidade organizacional inválida",
        )

    if dados.perfil not in {"usuario", "tecnico", "administrador"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Perfil inválido",
        )

    usuario = Usuario(
        nome=dados.nome.strip(),
        email=email,
        senha_hash=gerar_hash_senha(dados.senha),
        unidade_id=unidade.id,
        perfil=dados.perfil,
        ativo=True,
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    # Carrega a unidade para o UsuarioResponse
    usuario = db.scalar(
        select(Usuario)
        .options(selectinload(Usuario.unidade))
        .where(Usuario.id == usuario.id)
    )

    return usuario