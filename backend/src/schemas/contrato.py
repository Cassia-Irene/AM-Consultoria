from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class ContratoBase(BaseModel):
    id_cliente: int
    data_inicio: date
    data_fim: Optional[date] = None
    # ✅ Adicionado: Obrigatório no SQL (V003)
    servicos_contratados: str 
    visitas_previstas_mes: int
    inclui_relatorio: bool = False
    # ✅ Renomeado: De 'observacoes' para 'observacoes_gerais' para espelhar o banco
    observacoes_gerais: Optional[str] = None

class ContratoCreate(ContratoBase):
    pass

class ContratoRead(ContratoBase):
    id_contrato: int
    
    model_config = ConfigDict(from_attributes=True)