from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class ContratoPagamentoBase(BaseModel):
    id_contrato: int
    id_tipo_pagamento: int
    valor: Decimal

class ContratoPagamentoCreate(ContratoPagamentoBase):
    pass

class ContratoPagamentoRead(ContratoPagamentoBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)