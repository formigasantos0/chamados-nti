from datetime import datetime

from pydantic import BaseModel, Field


class ChamadoCriar(BaseModel):
    titulo: str = Field(min_length=3, max_length=200)
    descricao: str = Field(min_length=5)
    categoria: str = Field(min_length=2, max_length=50)
    prioridade: str = "normal"


class SolicitanteResumo(BaseModel):
    id: int
    nome: str
    email: str

    model_config = {
        "from_attributes": True
    }


class UnidadeChamadoResumo(BaseModel):
    id: int
    nome: str
    sigla: str

    model_config = {
        "from_attributes": True
    }


class ChamadoResponse(BaseModel):
    id: int
    protocolo: str
    titulo: str
    descricao: str
    categoria: str
    prioridade: str
    status: str

    solicitante_id: int
    unidade_id: int
    responsavel_id: int | None

    criado_em: datetime
    atualizado_em: datetime

    solicitante: SolicitanteResumo
    unidade: UnidadeChamadoResumo

    model_config = {
        "from_attributes": True
    }

class ChamadoAtualizar(BaseModel):
    status: str | None = None
    prioridade: str | None = None
    responsavel_id: int | None = None

class MensagemCriar(BaseModel):
    mensagem: str = Field(min_length=1, max_length=5000)


class MensagemResponse(BaseModel):
    id: int
    tipo: str
    descricao: str
    usuario_id: int
    criado_em: datetime

    model_config = {
        "from_attributes": True
    }

class UsuarioHistoricoResumo(BaseModel):
    id: int
    nome: str
    perfil: str

    model_config = {
        "from_attributes": True
    }

class HistoricoResponse(BaseModel):
    id: int
    tipo: str
    descricao: str
    usuario_id: int
    criado_em: datetime
    usuario: UsuarioHistoricoResumo

    model_config = {
        "from_attributes": True
    }