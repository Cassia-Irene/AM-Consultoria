from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date
from decimal import Decimal

class ProjetoParcelaBase(BaseModel):
    id_projeto: int
    numero_parcela: int
    valor_parcela: Decimal
    #data_vencimento: date
    data_pagamento_prevista: Optional[date] = None
    data_pagamento: Optional[date] = None
    pago: bool = False

class ProjetoParcelaUpdate(BaseModel):
    data_pagamento: Optional[date] = None
    pago: Optional[bool] = None
    # Permitir mudar o valor ou a observação depois
    valor_parcela: Optional[Decimal] = None
    
class ProjetoParcelaCreate(ProjetoParcelaBase):
    pass

class ProjetoParcelaRead(ProjetoParcelaBase):
    id_parcela: int
    
    model_config = ConfigDict(from_attributes=True)