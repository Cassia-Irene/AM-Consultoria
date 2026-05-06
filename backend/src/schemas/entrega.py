from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class EntregaBase(BaseModel):
    id_projeto: int
    titulo: str
    descricao: Optional[str] = None
    data_prevista: date
    data_entrega: Optional[date] = None
    status: str = "Pendente"

class EntregaCreate(EntregaBase):
    pass

class EntregaRead(EntregaBase):
    id_entrega: int
    
    model_config = ConfigDict(from_attributes=True)