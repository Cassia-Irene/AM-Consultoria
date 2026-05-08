from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VisitaBase(BaseModel):
    id_contrato: int
    id_projeto: Optional[int] = None
    status: str = "agendada"
    data_hora: datetime
    duracao_minutos: Optional[int] = None
    tipo_visita: str
    modalidade: str # Deve ser 'presencial' ou 'remota'
    descricao: Optional[str] = None
    resultados: Optional[str] = None

class VisitaCreate(VisitaBase):
    pass

class VisitaRead(VisitaBase):
    id_visita: int
    
    model_config = ConfigDict(from_attributes=True)