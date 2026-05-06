from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date
from decimal import Decimal

class FaturamentoClienteBase(BaseModel):
    id_contrato: int
    mes_referencia: int
    ano_referencia: int
    valor_base: Decimal
    valor_extra: Decimal = Decimal('0.00')
    valor_total: Decimal
    pago: bool = False
    data_pagamento: Optional[date] = None

class FaturamentoClienteCreate(FaturamentoClienteBase):
    pass

class FaturamentoClienteRead(FaturamentoClienteBase):
    id_faturamento: int
    
    model_config = ConfigDict(from_attributes=True)