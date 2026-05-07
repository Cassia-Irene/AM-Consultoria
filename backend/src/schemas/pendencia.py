from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PendenciaBase(BaseModel):
    id_visita: Optional[int] = None
    id_contrato: int
    
    descricao: str
    responsavel: str
    
    data_origem: datetime
    data_prazo: Optional[datetime] = None
    
    resolvida: bool = False
    data_resolucao: Optional[datetime] = None
    
    observacoes: Optional[str] = None

class PendenciaCreate(PendenciaBase):
    pass

class PendenciaRead(PendenciaBase):
    id_pendencia: int
    
    model_config = ConfigDict(from_attributes=True)