from pydantic import BaseModel, ConfigDict
from datetime import datetime

class HistoricoContratoBase(BaseModel):
    id_contrato: int
    data_alteracao: datetime # Data e hora da alteração do contrato
    descricao_alteracao: str

class HistoricoContratoCreate(HistoricoContratoBase):
    pass

class HistoricoContratoRead(HistoricoContratoBase):
    id_historico: int
    
    model_config = ConfigDict(from_attributes=True)