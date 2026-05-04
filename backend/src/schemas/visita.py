from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class VisitaBase(BaseModel):
    id_cliente: int
    id_contrato: int
    data_visita: date
    tipo_visita: str
    modalidade: str
    duracao_estimada_minutos: int
    status: str = "Agendada"
    descricao: Optional[str] = None
    resultado: Optional[str] = None

class VisitaCreate(VisitaBase):
    pass

class VisitaRead(VisitaBase):
    id_visita: int
    
    model_config = ConfigDict(from_attributes=True)