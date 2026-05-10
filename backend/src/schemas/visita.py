from pydantic import BaseModel, ConfigDict
from typing import Optional, List
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
    status: Optional[str] = None
    data_hora: Optional[datetime] = None
    duracao_minutos: Optional[int] = None
    tipo_visita: Optional[str] = None
    modalidade: Optional[str] = None
    descricao: Optional[str] = None
    resultados: Optional[str] = None

class MotivoAcionamentoRead(BaseModel):
    id_motivo: int
    nome: str
    slug: str
    descricao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)