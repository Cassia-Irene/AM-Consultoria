from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .pendencia import PendenciaCreate

class VisitaBase(BaseModel):
    id_cliente: int
    id_contrato: int
    id_projeto: Optional[int] = None
    
    data_hora: datetime 
    modalidade: str
    duracao_estimada_minutos: int
    status: str = "Agendada"
    descricao: Optional[str] = None
    resultados: Optional[str] = None

class VisitaCreate(VisitaBase):
    pendencias: Optional[List[PendenciaCreate]] = []

class VisitaRead(VisitaBase):
    id_visita: int
    
    # Configuração para integração com SQLAlchemy
    model_config = ConfigDict(from_attributes=True)