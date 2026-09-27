from typing import Literal

from pydantic import BaseModel, Field


TipoUnidade = Literal[
    "assessoria",
    "diretoria",
    "nucleo",
    "presidencia",
]


class UnidadeCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    sigla: str = Field(min_length=2, max_length=10)
    tipo: TipoUnidade
    parent_id: int | None = None


class UnidadeAtualizar(BaseModel):
    nome: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    sigla: str | None = Field(
        default=None,
        min_length=2,
        max_length=10,
    )
    tipo: TipoUnidade | None = None
    parent_id: int | None = None
    ativo: bool | None = None


class UnidadeResponse(BaseModel):
    id: int
    nome: str
    sigla: str
    tipo: str
    parent_id: int | None
    ativo: bool

    model_config = {
        "from_attributes": True
    }