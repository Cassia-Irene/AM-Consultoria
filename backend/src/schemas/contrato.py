from decimal import Decimal

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class ContratoBase(BaseModel):
    id_cliente: int
    data_inicio: date
    data_fim: Optional[date] = None
    servicos_contratados: str 
    visitas_previstas_mes: int
    inclui_relatorio: bool = False
    observacoes_gerais: Optional[str] = None

class ContratoCreate(ContratoBase):
    pass

class ContratoRead(ContratoBase):
    id_contrato: int
    
    model_config = ConfigDict(from_attributes=True)

class ContratoReplaceRequest(BaseModel):
    contrato_id: int
    visitas_previstas_mes: int