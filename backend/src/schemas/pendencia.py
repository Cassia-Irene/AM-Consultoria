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
    def intelligence(self) -> dict:
        """KPIs de Prioridade calculados pelo PriorityEngine."""
        from src.services.intelligence.priority_engine import calculate_pendencia_score, get_urgency_label, get_diff_dias
        if not self.data_prazo:
            return {"score": 0, "label": "sem prazo", "atraso": 0}
            
        return {
            "score": calculate_pendencia_score(self),
            "label": get_urgency_label(self.data_prazo),
            "atraso": get_diff_dias(self.data_prazo)
        }

    @computed_field
    @property
    def score_prioridade(self) -> int:
        return self.intelligence["score"]

    @computed_field
    @property
    def urgencia_label(self) -> str:
        return self.intelligence["label"]

    @computed_field
    @property
    def dias_atraso(self) -> int:
        # Retorna o valor absoluto de dias se estiver atrasado (negativo em get_diff_dias)
        diff = self.intelligence["atraso"]
        return abs(diff) if diff < 0 else 0
