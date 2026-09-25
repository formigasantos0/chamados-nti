from datetime import datetime

from pydantic import BaseModel, Field


class CategoriaCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    descricao: str | None = None
    ordem: int = Field(default=0, ge=0)


class CategoriaAtualizar(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=100)
    descricao: str | None = None
    ativo: bool | None = None
    ordem: int | None = Field(default=None, ge=0)


class CategoriaResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None
    ativo: bool
    ordem: int
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}