from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal

class BaseAnalyticsSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class DashboardSummary(BaseAnalyticsSchema):
    contratos_ativos: int
    pendencias_abertas: int
    eventos_criticos: int
    faturamento_mes: Decimal
    inadimplencia_count: int
    entregas_atraso: int

class TimelineEvent(BaseAnalyticsSchema):
    tipo: str
    id_referencia: int
    id_contrato: int
    data: datetime
    titulo: str
    cliente: str
    categoria: str
    criticidade: str
    status_pagamento: Optional[str] = None
    pendencias_contagem: Optional[int] = 0
    ultima_visita_resultados: Optional[str] = None
    pendencias_lista: Optional[List[dict]] = None
    id_projeto: Optional[int] = None

class CaosScore(BaseAnalyticsSchema):
    cliente: str
    id_contrato: int
    visitas_urgentes: int
    pendencias_atrasadas: int
    eventos_ativos: int # Adicionado
    caos_score: int

class OpenPendency(BaseAnalyticsSchema):
    id: int
    cliente: str
    descricao: str
    responsavel: str
    data_origem: date
    data_prazo: Optional[date]
    status_prazo: str

class ActiveProject(BaseAnalyticsSchema):
    id: int
    cliente: str
    projeto: str
    status: str
    valor_total: Decimal
    id_contrato: int
    entregas_pendentes: int
    parcelas_pendentes: int
    nivel_tensao: Optional[str] = None
    motivo_tensao: Optional[str] = None
    is_estagnado: Optional[bool] = None
    motivo_estagnacao: Optional[str] = None


class FinancialMonth(BaseAnalyticsSchema):
    mes: datetime
    receita_recorrente: Decimal
    receita_projetos: Decimal
    receita_total: Decimal

class ContractHistory(BaseAnalyticsSchema):
    cliente: str
    id_antigo: int
    id_novo: int
    data_alteracao: datetime
    motivo_alteracao: str
    novos_termos: str

class CriticalEvent(BaseAnalyticsSchema):
    cliente: str
    descricao: str
    data_evento: date
    id_visita: Optional[int]
    status_operacional: str

class ExtraVisitSummary(BaseAnalyticsSchema):
    cliente: str
    qtd_extras: int
    mes: int
    ano: int
    
class TopPriority(BaseAnalyticsSchema):
    id: int
    id_contrato: int
    tipo: str
    titulo: str
    cliente: str
    data_prazo: Optional[date]
    status_prazo: str
    score_prioridade: int
    motivo_prioridade: Optional[str] = None

class PlanningOverview(BaseAnalyticsSchema):
    cliente: str
    visitas_semanais: int
    pendencias_atrasadas: int
    pendencias_atencao: int
    pendencias_normais: int

class ClientHealth(BaseAnalyticsSchema):
    cliente: str
    id_contrato: int
    visitas_urgentes: int
    pendencias_atrasadas: int
    eventos_ativos: int
    entregas_atrasadas: int
    progresso_medio: int
    ultima_entrega_data: Optional[date] = None # Adicionado
    total_minutos_invisiveis: int
    status_operacional: str # Substituiu perfil e indice_desgaste

class TodayVisit(BaseAnalyticsSchema):
    id_visita: int
    id_contrato: int
    data_hora: datetime
    tipo_visita: str
    modalidade: str
    status: str
    cliente: str
    pendencias_contagem: int
    status_pagamento: Optional[str] = None
    ultima_visita_resultados: Optional[str] = None
    pendencias_lista: Optional[List[dict]] = None
