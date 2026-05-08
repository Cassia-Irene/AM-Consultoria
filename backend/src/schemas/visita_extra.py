from pydantic import BaseModel, ConfigDict

class VisitaExtraBase(BaseModel):
    id_visita: int
    solicitado_por: int

class VisitaExtraCreate(VisitaExtraBase):
    pass

class VisitaExtraRead(VisitaExtraBase):
    id_extra: int
    
    model_config = ConfigDict(from_attributes=True)