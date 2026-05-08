from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class ProjetoExtraBase(BaseModel):
    id_projeto: int
    solicitado_por: int
    aprovado_por: int = None

class ProjetoExtraCreate(ProjetoExtraBase):
    pass

class ProjetoExtraRead(ProjetoExtraBase):
    id_extra: int
    
    model_config = ConfigDict(from_attributes=True)