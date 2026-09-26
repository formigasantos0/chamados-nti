from pydantic import BaseModel, EmailStr, Field


class UsuarioCriar(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    unidade_id: int
    perfil: str = "usuario"

class UsuarioAtualizar(BaseModel):
    nome: str | None = Field(
        default=None,
        min_length=3,
        max_length=150,
    )
    email: EmailStr | None = None
    unidade_id: int | None = None
    perfil: str | None = None
    ativo: bool | None = None


class UsuarioRedefinirSenha(BaseModel):
    senha: str = Field(
        min_length=8,
        max_length=128,
    )

class UnidadeResumo(BaseModel):
    id: int
    nome: str
    sigla: str

    model_config = {
        "from_attributes": True
    }


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    perfil: str
    ativo: bool
    unidade_id: int
    unidade: UnidadeResumo

    model_config = {
        "from_attributes": True
    }