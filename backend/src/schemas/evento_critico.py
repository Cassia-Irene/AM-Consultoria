from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class EventoCriticoBase(BaseModel):
    id_contrato: int
    id_visita: Optional[int] = None
    data_evento: date
    descricao: str
    acao_tomada: Optional[str] = None

class EventoCriticoCreate(EventoCriticoBase):
    pass

class EventoCriticoRead(EventoCriticoBase):
    id_evento: int
    
    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel
from typing import Optional
from datetime import date

class EventoCriticoUpdate(BaseModel):
    descricao: Optional[str] = None
    acao_tomada: Optional[str] = None