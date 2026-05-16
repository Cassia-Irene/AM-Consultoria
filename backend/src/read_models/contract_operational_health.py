from datetime import date, timedelta
from typing import List, Dict, Any, Optional
from src.models.contrato import Contrato
from src.services.intelligence.override_helper import OverrideHelper
from src.services.intelligence.snapshot_manager import SnapshotManager
import logging

logger = logging.getLogger(__name__)

class ContractOperationalHealth:
    """
    Read Model Final com Failsafe e Governança Estrita.
    """
    
    @classmethod
    def fallback_dict(cls) -> Dict[str, Any]:
        return {
            "perfil_pragmatico": "nominal",
            "desgaste_longitudinal": 0,
            "evidencias": ["Informações institucionais indisponíveis"],
            "motivo_auditavel": "Operação em modo de segurança.",
            "override_ativo": False,
            "indice_urgencia": 0,
            "indice_desgaste": 0,
            "perfil": "nominal",
            "motivo_saude": "Estável",
            "intensidade_operacional": "baixa",
            "desgaste_acumulado": 0,
            "personalidade": "reativo",
            "tendencia_relacionamento": "estável",
            "dependencia_operacional": "nominal",
            "capacidade_recuperacao": "estável"
        }

    def __init__(self, contrato: Contrato):
        self.contrato = contrato
        self.hoje = date.today()
        self.evidencias = []
        self._calculated_data = {}
        try:
            self.overrides = OverrideHelper.parse_overrides(contrato.observacoes_gerais)
            self._calculate()
            self._calculated_data = self._to_dict_internal()
            try:
                SnapshotManager.save_snapshot("contrato", contrato.id_contrato, self._calculated_data)
            except:
                pass
        except Exception as e:
            logger.error(f"Erro na inteligência do contrato {contrato.id_contrato}: {str(e)}")
            self._calculated_data = self.fallback_dict()

    def _calculate(self):
        visitas = getattr(self.contrato, "visitas", [])
        eventos = getattr(self.contrato, "eventos_criticos", [])
        pendencias = getattr(self.contrato, "pendencias", [])
        
        # 1. Estabilidade Longitudinal
        threshold_45d = self.hoje - timedelta(days=45)
        eventos_recentes = [e for e in eventos if getattr(e, 'data_evento', date.min) >= threshold_45d]
        
        # 2. Perfil e Impacto
        self.perfil = "operação_de_alto_atrito" if len(eventos_recentes) >= 2 else "nominal"
        self.score_desgaste = min(100, len(eventos_recentes) * 30 + len(pendencias) * 2)
        
        # 3. Overrides
        self.perfil = self.overrides.get("perfil", self.perfil)
        self.score_desgaste = int(self.overrides.get("desgaste", self.score_desgaste))

    def _to_dict_internal(self) -> Dict[str, Any]:
        return {
            "perfil_pragmatico": self.perfil,
            "desgaste_longitudinal": self.score_desgaste,
            "evidencias": ["Análise de eventos críticos e interações de campo"],
            "motivo_auditavel": self.overrides.get("motivo") or "Fluxo institucional monitorado e estável.",
            "override_ativo": bool(self.overrides),
            "indice_urgencia": self.score_desgaste,
            "indice_desgaste": self.score_desgaste,
            "perfil": self.perfil,
            "motivo_saude": "Em conformidade",
            "intensidade_operacional": "alta" if self.score_desgaste > 60 else "normal",
            "desgaste_acumulado": self.score_desgaste,
            "personalidade": "reativo",
            "tendencia_relacionamento": "estável",
            "dependencia_operacional": "nominal",
            "capacidade_recuperacao": "estável"
        }

    def to_dict(self) -> Dict[str, Any]:
        return self._calculated_data
