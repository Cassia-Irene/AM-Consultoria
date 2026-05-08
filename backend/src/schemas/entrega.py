from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class EntregaBase(BaseModel):
    id_projeto: int
    descricao: Optional[str] = None
    data_entrega_prevista: date
    data_entrega_real: Optional[date] = None
    entregue: bool = False
    referencia_doc: Optional[str] = None
    

class EntregaCreate(EntregaBase):
    pass

class EntregaRead(EntregaBase):
    id_entrega: int
    
    model_config = ConfigDict(from_attributes=True)