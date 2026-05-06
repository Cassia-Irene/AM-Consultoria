from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class EventoCriticoBase(BaseModel):
    id_visita: int
    data_evento: date
    descricao: str
    acao_tomada: Optional[str] = None

class EventoCriticoCreate(EventoCriticoBase):
    pass

class EventoCriticoRead(EventoCriticoBase):
    id_evento: int
    
    model_config = ConfigDict(from_attributes=True)