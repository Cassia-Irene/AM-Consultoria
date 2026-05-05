from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date
from decimal import Decimal

class ContratoBase(BaseModel):
    id_cliente: int
    tipo_cobranca: str
    valor_mensal: Decimal
    visitas_previstas_mes: int
    valor_visita_extra: Optional[Decimal] = None
    inclui_relatorio: bool = False
    data_inicio: date
    data_fim: Optional[date] = None
    status: str = "ativo"
    motivo_alteracao: Optional[str] = None
    observacoes: Optional[str] = None

class ContratoCreate(ContratoBase):
    pass

class ContratoRead(ContratoBase):
    id_contrato: int
    
    model_config = ConfigDict(from_attributes=True)

class ContratoReplaceRequest(BaseModel):
    contrato_id: int
    novo_valor_mensal: Decimal
    visitas_previstas_mes: int
    motivo_alteracao: str