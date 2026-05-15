from pydantic import BaseModel, ConfigDict, computed_field
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

    @computed_field
    @property
    def queue_logic(self) -> dict:
        """Read Model de Priorização da Pendência."""
        from src.read_models.operational_priority_queue import OperationalPriorityQueue
        # Como o Read Model trabalha com lista, criamos um helper para item único ou usamos a lógica interna
        engine = OperationalPriorityQueue([self])
        res = engine.to_list()
        return res[0] if res else {"score": 0, "motivo": "Resolvida"}

    @computed_field
    @property
    def score_prioridade(self) -> int:
        return self.queue_logic["score"]

    @computed_field
    @property
    def motivo_prioridade(self) -> str:
        return self.queue_logic["motivo"]

    @computed_field
    @property
    def urgencia_label(self) -> str:
        from src.services.intelligence.priority_engine import get_urgency_label
        return get_urgency_label(self.data_prazo) if self.data_prazo else "sem prazo"

    @computed_field
    @property
    def dias_atraso(self) -> int:
        from src.services.intelligence.priority_engine import get_diff_dias
        if not self.data_prazo: return 0
        diff = get_diff_dias(self.data_prazo)
        return abs(diff) if diff < 0 else 0
