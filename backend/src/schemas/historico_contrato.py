from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional

class HistoricoContratoBase(BaseModel):
    id_contrato_encerrado: int
    id_contrato_novo: Optional[int] = None
    data_alteracao: date # Data e hora da alteração do contrato
    motivo_alteracao: str

class HistoricoContratoCreate(HistoricoContratoBase):
    pass

class HistoricoContratoRead(HistoricoContratoBase):
    id_historico: int = Field(validation_alias="id")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)