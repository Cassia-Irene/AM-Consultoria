
from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProjetoExtraBase(BaseModel):
    id_projeto: int
    solicitado_por: int
    aprovado_por: Optional[int] = None

class ProjetoExtraCreate(ProjetoExtraBase):
    pass

class ProjetoExtraRead(ProjetoExtraBase):
    id_extra: int
    
    model_config = ConfigDict(from_attributes=True)

class ProjetoExtraUpdate(BaseModel):
    aprovado_por:(Optional[int]) = None 