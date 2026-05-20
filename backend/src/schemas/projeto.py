from decimal import Decimal
from pydantic import BaseModel, ConfigDict, computed_field, Field
from typing import Optional, List
from datetime import date

from src.schemas.entrega import EntregaRead
from src.schemas.contrato import ContratoRead
from src.schemas.visita import VisitaRead
from src.schemas.projeto_parcela import ProjetoParcelaRead
from src.schemas.projeto_extra import ProjetoExtraRead
from src.schemas.pendencia import PendenciaRead
from src.schemas.evento_critico import EventoCriticoRead

# O Projeto é a entidade que representa a execução do contrato, ou seja, o acompanhamento das visitas, entregas e resultados. Ele tem um ciclo de vida próprio, com início, andamento e conclusão. Por isso, ele tem um schema específico para validação dos dados.
class ProjetoBase(BaseModel):
    id_contrato: int
    titulo: str
    descricao: Optional[str] = None
    valor_total: Decimal
    status: str
    data_inicio: date
    data_fim_prevista: Optional[date] = None
    data_fim_real: Optional[date] = None
    observacoes_gerais: Optional[str] = None
    
class ProjetoCreate(ProjetoBase):
    pass

class ProjetoRead(ProjetoBase):
    id_projeto: int
    
    # Operação Real (Consolidação de Dados)
    entregas: List[EntregaRead] = []
    visitas: List[VisitaRead] = []
    parcelas: List[ProjetoParcelaRead] = []
    extras: List[ProjetoExtraRead] = []
    
    # Campo interno para inteligência (Excluído do JSON final ou usado em lógica)
    contrato: Optional[ContratoRead] = Field(default=None, exclude=True)
    
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def id_cliente(self) -> Optional[int]:
        """Atalho para o ID do cliente dono do contrato."""
        return self.contrato.id_cliente if self.contrato else None

    @computed_field
    @property
    def eventos_criticos(self) -> List[EventoCriticoRead]:
        """Consolida eventos críticos do contrato para visão contextual."""
        if not self.contrato or not self.contrato.eventos_criticos:
            return []
        return self.contrato.eventos_criticos

    @computed_field
    @property
    def pendencias(self) -> List[PendenciaRead]:
        """Consolida as pendências vinculadas ao contrato deste projeto."""
        if not self.contrato or not self.contrato.pendencias:
            return []
        return self.contrato.pendencias

    @computed_field
    @property
    def atrasado(self) -> bool:
        """Calcula se o projeto está atrasado com base na data atual."""
        if not self.status or not self.data_fim_prevista:
            return False
            
        status_limpo = self.status.lower().strip()
        return status_limpo == 'em andamento' and self.data_fim_prevista < date.today()

    @computed_field
    @property
    def operational(self) -> dict:
        """Read Model do Estado Operacional do Projeto."""
        from src.read_models.project_operational_state import ProjectOperationalState
        return ProjectOperationalState(self).to_dict()

    @computed_field
    @property
    def score_tensao(self) -> int:
        return self.operational["score_tensao"]

    @computed_field
    @property
    def nivel_tensao(self) -> str:
        return self.operational["nivel_tensao"]

    @computed_field
    @property
    def motivo_tensao(self) -> str:
        return self.operational["motivo_tensao"]

    @computed_field
    @property
    def count_atrasos(self) -> int:
        return self.operational["count_atrasos"]

    @computed_field
    @property
    def is_estagnado(self) -> bool:
        return self.operational["is_estagnado"]

    @computed_field
    @property
    def dias_sem_progresso(self) -> int:
        return self.operational["dias_sem_progresso"]

    @computed_field
    @property
    def motivo_estagnacao(self) -> Optional[str]:
        return self.operational["motivo_estagnacao"]

    @computed_field
    @property
    def ritmo_operacional(self) -> str:
        return self.operational["ritmo_operacional"]

    @computed_field
    @property
    def motivo_ritmo(self) -> str:
        return self.operational["motivo_ritmo"]

    @computed_field
    @property
    def tendencia_tensao(self) -> str:
        return self.operational["tendencia_tensao"]

    @computed_field
    @property
    def reincidencia(self) -> Optional[str]:
        return self.operational["reincidencia"]

    @computed_field
    @property
    def fase_operacional(self) -> str:
        return self.operational["fase_operacional"]

    @computed_field
    @property
    def evidencias(self) -> List[str]:
        return self.operational["evidencias"]

    @computed_field
    @property
    def motivo_auditavel(self) -> str:
        return self.operational["motivo_auditavel"]

    @computed_field
    @property
    def esforco_vs_resultado(self) -> str:
        return self.operational["esforco_vs_resultado"]

    @computed_field
    @property
    def falso_movimento(self) -> bool:
        return self.operational["falso_movimento"]

    @computed_field
    @property
    def override_ativo(self) -> bool:
        return self.operational["override_ativo"]

    @computed_field
    @property
    def score_operacional(self) -> int:
        return self.operational["score_operacional"]

    @computed_field
    @property
    def tendencia(self) -> str:
        return self.operational["tendencia"]

    @computed_field
    @property
    def dias_sem_movimento(self) -> int:
        return self.operational["dias_sem_movimento"]

    @computed_field
    @property
    def desgaste_longitudinal(self) -> str:
        return self.operational["desgaste_longitudinal"]

    @computed_field
    @property
    def interpretacao_manual_ativa(self) -> bool:
        return self.operational["interpretacao_manual_ativa"]

    @computed_field
    @property
    def snapshot_recente(self) -> Optional[str]:
        return self.operational["snapshot_recente"]

    @computed_field
    @property
    def motivo_auditavel_resumido(self) -> str:
        return self.operational["motivo_auditavel_resumido"]

    @computed_field
    @property
    def timeline(self) -> List[dict]:
        return self.operational["timeline"]

    @computed_field
    @property
    def backlog_meta(self) -> dict:
        return self.operational["backlog_meta"]

    @computed_field
    @property
    def evidencias_resumidas(self) -> List[str]:
        return self.operational["evidencias_resumidas"]

    @computed_field
    @property
    def cadeia_causal(self) -> List[str]:
        return self.operational["cadeia_causal"]

    @computed_field
    @property
    def impacto_do_override(self) -> str:
        return self.operational["impacto_do_override"]

    @computed_field
    @property
    def percentual_conclusao(self) -> int:
        return self.operational["percentual_conclusao"]

    @computed_field
    @property
    def audit_history_resumo(self) -> List[dict]:
        return self.operational["audit_history_resumo"]

class ProjetoUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    valor_total: Decimal | None = None
    status: str | None = None
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    data_fim_real: date | None = None
    observacoes_gerais: str | None = None

ProjetoRead.model_rebuild()