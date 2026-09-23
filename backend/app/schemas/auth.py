from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioAutenticado(BaseModel):
    id: int
    nome: str
    email: str
    perfil: str
    unidade_id: int

    model_config = {
        "from_attributes": True
    }