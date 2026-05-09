from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date # Use este aqui
from decimal import Decimal
from pydantic import field_validator

class FaturamentoClienteBase(BaseModel):
    id_contrato: int
    mes_ano: date
    visitas_realizadas: int = 0
    desconto: Decimal = Decimal('0.00')
    pago: bool = False
    data_pagamento: Optional[date] = None
    
class FaturamentoClienteCreate(FaturamentoClienteBase):
    pass

class FaturamentoClienteRead(FaturamentoClienteBase):
    id_faturamento: int
    valor_base: Decimal
    valor_total: Decimal
    valor_extra: Decimal
    model_config = ConfigDict(from_attributes=True)

@field_validator('mes_ano')
@classmethod
def deve_ser_primeiro_dia(cls, v: date) -> date:
    if v.day != 1:
        raise ValueError('mes_ano deve ser o primeiro dia do mês. Ex: 2024-01-01')
    return v