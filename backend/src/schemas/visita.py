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

class VisitaUpdate(BaseModel):
    status: str | None = None
    data_hora: datetime | None = None
    duracao_minutos: int | None = None
    tipo_visita: str | None = None
    modalidade: str | None = None
    descricao: str | None = None
    resultados: str | None = None