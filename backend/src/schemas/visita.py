from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoVisita(str, Enum):
    ROTINEIRA = "rotineira"
    URGENTE = "urgente"
    PONTUAL = "pontual"
    ESTRUTURADA = "estruturada"
    ACOMPANHAMENTO = "acompanhamento direcionado"

class VisitaBase(BaseModel):
    id_contrato: int
    id_projeto: Optional[int] = None
    status: str = "agendada"
    data_hora: datetime
    duracao_minutos: Optional[int] = None
    tipo_visita: TipoVisita
    modalidade: str 

    descricao: Optional[str] = None
    resultados: Optional[str] = None

class VisitaCreate(VisitaBase):
    pass

class VisitaRead(VisitaBase):
    id_visita: int
    
    model_config = ConfigDict(from_attributes=True)

class VisitaUpdate(BaseModel):
    status: Optional[str] = None
    data_hora: Optional[datetime] = None
    duracao_minutos: Optional[int] = None
    tipo_visita: Optional[TipoVisita] = None
    modalidade: Optional[str] = None
    descricao: Optional[str] = None
    resultados: Optional[str] = None