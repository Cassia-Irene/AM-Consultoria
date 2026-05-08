from pydantic import BaseModel, ConfigDict

class TipoPagamentoBase(BaseModel):
    tipo: str

class TipoPagamentoCreate(TipoPagamentoBase):
    pass

class TipoPagamentoRead(TipoPagamentoBase):
    id_tipo: int
    
    model_config = ConfigDict(from_attributes=True)