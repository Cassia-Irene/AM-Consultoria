from decimal import Decimal
from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional
from datetime import date

class ContratoBase(BaseModel):
    id_cliente: int
    data_inicio: date
    data_fim: Optional[date] = None
    servicos_contratados: str 
    visitas_previstas_mes: int
    inclui_relatorio: bool = False
    observacoes_gerais: Optional[str] = None

class ContratoCreate(ContratoBase):
    pass

class ContratoRead(ContratoBase):
    id_contrato: int
    valor_mensal: Optional[Decimal] = None
    
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def health(self) -> dict:
        """KPIs de Saúde do Contrato calculados pelo HealthEngine."""
        from src.services.intelligence.health_engine import calculate_client_health_score
        # Passamos as visitas e pendências já carregadas (joinedload recomendado)
        visitas = getattr(self, 'visitas', [])
        pendencias = [p for p in getattr(self, 'pendencias', []) if not p.resolvida]
        return calculate_client_health_score(self, visitas, pendencias)

    @computed_field
    @property
    def indice_urgencia(self) -> int:
        return self.health["indice_urgencia"]

    @computed_field
    @property
    def indice_desgaste(self) -> int:
        return self.health["indice_desgaste"]

    @computed_field
    @property
    def perfil(self) -> str:
        return self.health["perfil"]

class ContratoReplaceRequest(BaseModel):
    contrato_id: int
    visitas_previstas_mes: int
    novo_valor_mensal: Optional[Decimal] = None

class ContratoUpdateRestrito(BaseModel):
    servicos_contratados: str | None = None
    observacoes_gerais: str | None = None
    inclui_relatorio: bool | None = None