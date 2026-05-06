from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class PendenciaBase(BaseModel):
    id_visita: int
    status: str
    descricao: str
    data_identificacao: date
    data_resolucao: Optional[date] = None
    resolvida: bool = False
    observacoes: Optional[str] = None

class PendenciaCreate(PendenciaBase):
    pass

class PendenciaRead(PendenciaBase):
    id_pendencia: int
    
    model_config = ConfigDict(from_attributes=True)