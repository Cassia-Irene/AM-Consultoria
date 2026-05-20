from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class EntregaBase(BaseModel):
    id_projeto: int
    descricao: str
    data_entrega_prevista: date
    data_entrega_real: Optional[date] = None
    entregue: bool = False
    referencia_doc: Optional[str] = None
    

class EntregaCreate(EntregaBase):
    pass

class EntregaRead(EntregaBase):
    id_entrega: int
    
    model_config = ConfigDict(from_attributes=True)

class EntregaUpdate(BaseModel): 
    id_projeto: Optional[int] = None
    descricao: Optional[str] = None
    data_entrega_prevista: Optional[date] = None
    data_entrega_real: Optional[date] = None
    entregue: Optional[bool] = None
    referencia_doc: Optional[str] = None