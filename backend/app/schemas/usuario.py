from pydantic import BaseModel, EmailStr, Field


class UsuarioCriar(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    unidade_id: int
    perfil: str = "usuario"


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