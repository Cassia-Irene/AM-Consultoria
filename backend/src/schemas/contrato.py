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
    valor_mensal: Optional[Decimal] = None
    
    model_config = ConfigDict(from_attributes=True)

class ContratoReplaceRequest(BaseModel):
    contrato_id: int
    visitas_previstas_mes: int

class ContratoUpdateRestrito(BaseModel):
    servicos_contratados: str | None = None
    observacoes_gerais: str | None = None
    inclui_relatorio: bool | None = None