from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class ProjetoExtraBase(BaseModel):
    id_projeto: int
    descricao_extra: str
    valor_extra: Decimal
    aprovado: bool = False

class ProjetoExtraCreate(ProjetoExtraBase):
    pass

class ProjetoExtraRead(ProjetoExtraBase):
    id_extra: int
    
    model_config = ConfigDict(from_attributes=True)