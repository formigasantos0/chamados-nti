from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import criar_access_token, verificar_senha
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.api.dependencies import get_usuario_atual
from app.schemas.auth import UsuarioAutenticado


router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"],
)


@router.post("/login", response_model=TokenResponse)
def login(
    dados: LoginRequest,
    db: Session = Depends(get_db),
):
    usuario = db.scalar(
        select(Usuario).where(
            Usuario.email == dados.email
        )
    )

    if (
        usuario is None
        or not usuario.ativo
        or not verificar_senha(dados.senha, usuario.senha_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos",
        )

    token = criar_access_token(usuario.id)

    return TokenResponse(
        access_token=token
    )

@router.get("/me", response_model=UsuarioAutenticado)
def me(
    usuario: Usuario = Depends(get_usuario_atual),
):
    return usuario