from datetime import datetime

from pydantic import BaseModel, Field


class ChamadoCriar(BaseModel):
    titulo: str = Field(min_length=3, max_length=200)
    descricao: str = Field(min_length=5)
    categoria_id: int = Field(gt=0)
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

class CategoriaChamadoResumo(BaseModel):
    id: int
    nome: str

    model_config = {
        "from_attributes": True
    }

class ChamadoResponse(BaseModel):
    id: int
    protocolo: str
    titulo: str
    descricao: str
    categoria: CategoriaChamadoResumo
    prioridade: str
    status: str

    solicitante_id: int
    unidade_id: int
    responsavel_id: int | None
    categoria_id: int
    criado_em: datetime
    atualizado_em: datetime

    solicitante: SolicitanteResumo
    responsavel: SolicitanteResumo | None
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