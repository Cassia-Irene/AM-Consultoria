from pydantic import BaseModel, ConfigDict
from typing import Optional

class VisitaExtraBase(BaseModel):
    id_visita: int
    solicitado_por: int

class VisitaExtraCreate(VisitaExtraBase):
    pass

class VisitaExtraRead(VisitaExtraBase):
    id_extra: int
    
    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel
from typing import Optional

class VisitaExtraUpdate(BaseModel):
    solicitado_por: Optional[int] = None

