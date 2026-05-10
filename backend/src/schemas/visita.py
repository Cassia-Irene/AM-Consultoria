from pydantic import BaseModel, ConfigDict
<<<<<<< HEAD
from typing import Optional
from datetime import datetime
=======
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoVisita(str, Enum):
    ROTINEIRA = "rotineira"
    URGENTE = "urgente"
    PONTUAL = "pontual"
    ESTRUTURADA = "estruturada"
    ACOMPANHAMENTO = "acompanhamento direcionado"
>>>>>>> origin/cass

class VisitaBase(BaseModel):
    id_contrato: int
    id_projeto: Optional[int] = None
    status: str = "agendada"
    data_hora: datetime
    duracao_minutos: Optional[int] = None
<<<<<<< HEAD
    tipo_visita: str
    modalidade: str # Deve ser 'presencial' ou 'remota'
=======
    tipo_visita: TipoVisita
    modalidade: str 

>>>>>>> origin/cass
    descricao: Optional[str] = None
    resultados: Optional[str] = None

class VisitaCreate(VisitaBase):
    pass

class VisitaRead(VisitaBase):
    id_visita: int
    
    model_config = ConfigDict(from_attributes=True)

class VisitaUpdate(BaseModel):
<<<<<<< HEAD
    status: str | None = None
    data_hora: datetime | None = None
    duracao_minutos: int | None = None
    tipo_visita: str | None = None
    modalidade: str | None = None
    descricao: str | None = None
    resultados: str | None = None
=======
    status: Optional[str] = None
    data_hora: Optional[datetime] = None
    duracao_minutos: Optional[int] = None
    tipo_visita: Optional[TipoVisita] = None
    modalidade: Optional[str] = None
    descricao: Optional[str] = None
    resultados: Optional[str] = None
>>>>>>> origin/cass
