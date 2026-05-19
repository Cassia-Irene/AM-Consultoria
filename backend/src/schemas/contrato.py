from decimal import Decimal
from pydantic import BaseModel, ConfigDict, computed_field, Field
from typing import Optional, List
from datetime import date
from src.schemas.evento_critico import EventoCriticoRead
from src.schemas.pendencia import PendenciaRead

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
    
    # Campo interno para inteligência
    eventos_criticos: List[EventoCriticoRead] = Field(default_factory=list, exclude=True)
    pendencias: List[PendenciaRead] = Field(default_factory=list, exclude=True)
    
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def health_state(self) -> dict:
        """Read Model de Saúde Institucional do Contrato."""
        from src.read_models.contract_operational_health import ContractOperationalHealth
        return ContractOperationalHealth(self).to_dict()

    @computed_field
    @property
    def indice_urgencia(self) -> int:
        return self.health_state["indice_urgencia"]

    @computed_field
    @property
    def indice_desgaste(self) -> int:
        return self.health_state["indice_desgaste"]

    @computed_field
    @property
    def perfil(self) -> str:
        return self.health_state["perfil"]

    @computed_field
    @property
    def motivo_saude(self) -> str:
        return self.health_state["motivo_saude"]

    @computed_field
    @property
    def intensidade_operacional(self) -> str:
        return self.health_state["intensidade_operacional"]

    @computed_field
    @property
    def desgaste_acumulado(self) -> int:
        return self.health_state["desgaste_acumulado"]

    @computed_field
    @property
    def personalidade(self) -> str:
        return self.health_state["personalidade"]

    @computed_field
    @property
    def evidencias(self) -> List[str]:
        return self.health_state["evidencias"]

    @computed_field
    @property
    def motivo_auditavel(self) -> str:
        return self.health_state["motivo_auditavel"]

    @computed_field
    @property
    def desgaste_longitudinal(self) -> int:
        return self.health_state["desgaste_longitudinal"]

    @computed_field
    @property
    def dependencia_operacional(self) -> str:
        return self.health_state["dependencia_operacional"]

    @computed_field
    @property
    def capacidade_recuperacao(self) -> str:
        return self.health_state["capacidade_recuperacao"]

    @computed_field
    @property
    def override_ativo(self) -> bool:
        return self.health_state["override_ativo"]

    @computed_field
    @property
    def perfil_pragmatico(self) -> str:
        return self.health_state["perfil_pragmatico"]

class ContratoReplaceRequest(BaseModel):
    contrato_id: int
    visitas_previstas_mes: int
    novo_valor_mensal: Optional[Decimal] = None

class ContratoUpdateRestrito(BaseModel):
    servicos_contratados: str | None = None
    observacoes_gerais: str | None = None
    inclui_relatorio: bool | None = None
    data_fim: date | None = None

ContratoRead.model_rebuild()