from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date
from decimal import Decimal

class RecebimentoBase(BaseModel):
    id_contrato_pagamento: int
    data_recebimento: date
    valor_recebido: Decimal
    observacoes: Optional[str] = None

class RecebimentoCreate(RecebimentoBase):
    pass

class RecebimentoRead(RecebimentoBase):
    id_recebimento: int
    
    model_config = ConfigDict(from_attributes=True)