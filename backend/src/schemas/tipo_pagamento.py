from pydantic import BaseModel, ConfigDict

class TipoPagamentoBase(BaseModel):
    nome: str

class TipoPagamentoCreate(TipoPagamentoBase):
    pass

class TipoPagamentoRead(TipoPagamentoBase):
    id_tipo: int
    
    model_config = ConfigDict(from_attributes=True)