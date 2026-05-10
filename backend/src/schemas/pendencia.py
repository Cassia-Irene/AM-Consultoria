from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

class PendenciaBase(BaseModel):
    id_visita: Optional[int] = None
    id_contrato: int
    descricao: str
    data_origem: Optional[date] = None
    data_resolucao: Optional[date] = None
    resolvida: bool = False
    responsavel: Optional[str] = None
    data_prazo: Optional[date] = None


class PendenciaUpdate(BaseModel):
    descricao: Optional[str] = None
    data_resolucao: Optional[date] = None
    resolvida: Optional[bool] = None
    responsavel: Optional[str] = None
    data_prazo: Optional[date] = None

class PendenciaCreate(PendenciaBase):
    pass

class PendenciaRead(PendenciaBase):
    id_pendencia: int
    
    model_config = ConfigDict(from_attributes=True)
