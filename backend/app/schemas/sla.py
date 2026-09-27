from datetime import date, time

from pydantic import BaseModel, Field


class PoliticaSLAResponse(BaseModel):
    id: int
    prioridade: str
    primeiro_atendimento_minutos: int
    resolucao_minutos: int
    ativo: bool

    model_config = {"from_attributes": True}


class PoliticaSLAAtualizar(BaseModel):
    primeiro_atendimento_minutos: int | None = Field(
        default=None,
        gt=0,
    )
    resolucao_minutos: int | None = Field(
        default=None,
        gt=0,
    )
    ativo: bool | None = None


class ConfiguracaoSLAResponse(BaseModel):
    id: int
    timezone: str
    hora_inicio: time
    hora_fim: time

    segunda: bool
    terca: bool
    quarta: bool
    quinta: bool
    sexta: bool
    sabado: bool
    domingo: bool

    model_config = {"from_attributes": True}


class ConfiguracaoSLAAtualizar(BaseModel):
    timezone: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    hora_inicio: time | None = None
    hora_fim: time | None = None

    segunda: bool | None = None
    terca: bool | None = None
    quarta: bool | None = None
    quinta: bool | None = None
    sexta: bool | None = None
    sabado: bool | None = None
    domingo: bool | None = None


class FeriadoCriar(BaseModel):
    data: date
    nome: str = Field(
        min_length=2,
        max_length=150,
    )


class FeriadoAtualizar(BaseModel):
    data: date | None = None
    nome: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    ativo: bool | None = None


class FeriadoResponse(BaseModel):
    id: int
    data: date
    nome: str
    ativo: bool

    model_config = {"from_attributes": True}