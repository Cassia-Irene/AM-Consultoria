from pydantic import BaseModel, ConfigDict

# ⚠️ [DEPRECATED] Utilize VisitaCreate com contexto_agendamento
class VisitaExtraBase(BaseModel):
    id_visita: int
    motivo_extra: str

class VisitaExtraCreate(VisitaExtraBase):
    pass

class VisitaExtraRead(VisitaExtraBase):
    id_extra: int
    
    model_config = ConfigDict(from_attributes=True)