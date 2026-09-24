from datetime import datetime

from pydantic import BaseModel


class AnexoResponse(BaseModel):
    id: int
    chamado_id: int
    usuario_id: int
    nome_original: str
    content_type: str
    tamanho_bytes: int
    criado_em: datetime

    model_config = {"from_attributes": True}

class AnexoDownloadResponse(BaseModel):
    url: str
    expira_em_segundos: int