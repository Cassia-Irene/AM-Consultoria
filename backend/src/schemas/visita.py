from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .pendencia import PendenciaCreate

class MotivoAcionamentoRead(BaseModel):
    id_motivo: int
    nome: str
    slug: str
    descricao: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class VisitaBase(BaseModel):
    id_cliente: int
    id_contrato: int
    id_projeto: Optional[int] = None
    
    # 🧠 Dimensões Operacionais
    tipo_visita: str = "rotineira"
    contexto_agendamento: str = "planejado"
    
    # 🚦 Contexto de Extra/Caos (Opcionais para o "Modo Caos")
    origem_solicitacao: Optional[str] = None
    id_contato_solicitante: Optional[int] = None
    motivo_acionamento_id: Optional[int] = None
    descricao_trigger: Optional[str] = None
    
    # 🔥 Métricas de Impacto
    severidade_operacional: Optional[str] = None
    tempo_resposta_minutos: Optional[int] = None
    impacto_operacional: Optional[str] = None
    
    # Execução
    data_hora: datetime 
    modalidade: str
    duracao_estimada_minutos: int
    status: str = "Realizada"
    descricao: Optional[str] = None
    resultados: Optional[str] = None

class VisitaCreate(VisitaBase):
    pendencias: Optional[List[PendenciaCreate]] = []

class VisitaRead(VisitaBase):
    id_visita: int
    # Enriquecimento opcional
    motivo_acionamento: Optional[MotivoAcionamentoRead] = None
    
    model_config = ConfigDict(from_attributes=True)