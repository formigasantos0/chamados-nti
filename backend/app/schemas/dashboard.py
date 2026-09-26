from pydantic import BaseModel


class DashboardResumo(BaseModel):
    total: int
    abertos: int
    em_atendimento: int
    aguardando_usuario: int
    resolvidos: int
    fechados: int
    urgentes: int
    sem_responsavel: int

class MetricaItem(BaseModel):
    nome: str
    quantidade: int


class DashboardMetricas(BaseModel):
    por_status: list[MetricaItem]
    por_prioridade: list[MetricaItem]
    por_categoria: list[MetricaItem]
    por_responsavel: list[MetricaItem]

class SLAIndicadorResumo(BaseModel):
    dentro_do_prazo: int
    proximo_do_vencimento: int
    cumprido: int
    violado: int


class DashboardSLA(BaseModel):
    primeiro_atendimento: SLAIndicadorResumo
    resolucao: SLAIndicadorResumo