from datetime import date, timedelta, datetime
from typing import List, Optional, Dict, Any, Tuple
from src.models.projeto import Projeto
from src.services.intelligence.override_helper import OverrideHelper
from src.services.intelligence.snapshot_manager import SnapshotManager
from src.services.intelligence.audit_manager import AuditManager
import logging

logger = logging.getLogger(__name__)

class ProjectOperationalState:
    """
    Read Model Final com Failsafe, Timeline Operacional e Aging.
    """
    
    @classmethod
    def fallback_dict(cls) -> Dict[str, Any]:
        return {
            "ritmo_operacional": "nominal",
            "fase_operacional": "manutenção",
            "esforco_vs_resultado": "estável",
            "falso_movimento": False,
            "evidencias": ["Dados analíticos indisponíveis"],
            "evidencias_resumidas": ["Dados indisponíveis"],
            "motivo_auditavel": "Modo de segurança ativo.",
            "motivo_auditavel_resumido": "Modo de segurança",
            "timeline": [],
            "backlog_meta": {"aging_medio": 0, "itens_criticos": 0},
            "score_tensao": 0,
            "score_operacional": 100,
            "nivel_tensao": "nominal",
            "motivo_tensao": "Estável",
            "dias_sem_progresso": 0,
            "dias_sem_movimento": 0,
            "motivo_estagnacao": None,
            "motivo_ritmo": "Nominal",
            "tendencia_tensao": "estável",
            "tendencia": "estável",
            "reincidencia": None,
            "interpretacao_manual_ativa": False,
            "override_ativo": False,
            "is_estagnado": False,
            "desgaste_longitudinal": "mínimo",
            "snapshot_recente": None
        }

    def __init__(self, projeto: Projeto):
        self.projeto = projeto
        self.hoje = date.today()
        self.evidencias = []
        self.timeline = []
        self._calculated_data = {}
        try:
            self.overrides = OverrideHelper.parse_overrides(projeto.observacoes_gerais)
            self._calculate()
            self._calculated_data = self._to_dict_internal()
        except Exception as e:
            logger.error(f"Erro na inteligência do projeto {self.projeto.id_projeto}: {str(e)}")
            self._calculated_data = self.fallback_dict()

    def persist_snapshot(self):
        """Persiste o estado atual como um snapshot imutável para o dia."""
        try:
            SnapshotManager.save_snapshot("projeto", self.projeto.id_projeto, self._calculated_data)
        except Exception as e:
            logger.warning(f"Falha ao salvar snapshot para projeto {self.projeto.id_projeto}: {str(e)}")

    def _calculate(self):
        # 1. Base Factual
        self.entregas_atrasadas = [e for e in self.projeto.entregas if not e.entregue and e.data_entrega_prevista and e.data_entrega_prevista < self.hoje]
        self.entregas_concluidas = [e for e in self.projeto.entregas if e.entregue]
        threshold_recent = self.hoje - timedelta(days=15)
        self.entregas_recentes = [e for e in self.entregas_concluidas if e.data_entrega_real and e.data_entrega_real >= threshold_recent]
        
        # 2. Dinâmicas Estáveis
        self.ritmo, self.fase = self._infer_stable_dynamics()
        
        # 3. Aging e Backlog
        self.aging_data = []
        for e in self.entregas_atrasadas:
            dias = (self.hoje - e.data_entrega_prevista).days
            self.aging_data.append({"id": e.id_entrega, "dias": dias})
        
        self.aging_medio = sum(a["dias"] for a in self.aging_data) / len(self.aging_data) if self.aging_data else 0
        
        # 4. Falso Movimento e Esforço vs Resultado
        self.falso_movimento = len(self.entregas_recentes) > 1 and len(self.entregas_atrasadas) > 3
        self.esforco = "desproporcional" if self.falso_movimento else "equilibrado"
        
        # 5. Timeline Operacional (Hierarquia Factual)
        self._build_timeline()
        
        # 6. Cadeia Causal Curta
        self._build_causal_chain()
        
        # 7. Overrides (Governança Humana)
        self.fase = self.overrides.get("fase", self.fase)
        self.ritmo = self.overrides.get("ritmo", self.ritmo)

        # 8. Progresso Factual Determinístico (Novo)
        total_entregas = len(self.projeto.entregas)
        concluidas = len(self.entregas_concluidas)
        self.percentual_conclusao = int((concluidas / total_entregas) * 100) if total_entregas > 0 else 0

    def _infer_stable_dynamics(self) -> Tuple[str, str]:
        if not self.entregas_recentes:
            if len(self.entregas_atrasadas) >= 3: return "em_atrito", "crise_operacional"
            if len(self.entregas_atrasadas) > 0: return "lento", "atraso_acumulado"
            
            # Projeto Novo ou Sem Atividade
            if not self.entregas_concluidas:
                return "nominal", "implantação"
            
            return "nominal", "estável"
        
        if len(self.entregas_recentes) >= 2 and len(self.entregas_atrasadas) > 2:
            return "falso_movimento", "recuperação_travada"
        
        if len(self.entregas_recentes) >= 1:
            return "nominal", "fluxo_ativo"
            
        return "nominal", "manutenção"

    def _build_timeline(self):
        events = []
        # Entregas Recentes
        for e in self.entregas_recentes:
            events.append({
                "data": e.data_entrega_real.isoformat(),
                "tipo": "entrega_concluida",
                "label": f"Entrega: {e.descricao}",
                "impacto": "positivo"
            })
        # Atrasos Críticos (Aging > 7 dias)
        for e in self.entregas_atrasadas:
            dias = (self.hoje - e.data_entrega_prevista).days
            if dias > 7:
                events.append({
                    "data": e.data_entrega_prevista.isoformat(),
                    "tipo": "atraso_critico",
                    "label": f"Atraso Crítico: {e.descricao} (+{dias}d)",
                    "impacto": "negativo"
                })
        # Eventos do Contrato
        if self.projeto.contrato and self.projeto.contrato.eventos_criticos:
            for ev in self.projeto.contrato.eventos_criticos[:5]:
                events.append({
                    "data": ev.data_evento.isoformat(),
                    "tipo": "evento_critico",
                    "label": f"Crise: {ev.descricao}",
                    "impacto": "negativo"
                })
        # Overrides (Audit Log)
        audit_history = AuditManager.get_history("projeto", self.projeto.id_projeto)
        import re
        for entry in audit_history[-5:]:
            detail = ""
            if "observacoes_gerais" in entry.get("changes", {}):
                val = str(entry["changes"]["observacoes_gerais"].get("para", ""))
                
                text_limpo = re.sub(r'\[.*?\]', '', val).strip()
                tags_match = re.findall(r'\[OVERRIDE_[A-Z]+:(.*?)\]', val)

                if text_limpo:
                    primeira_linha = text_limpo.split('\n')[0][:45]
                    sufixo = "..." if len(text_limpo) > 45 else ""
                    detail = f" - {primeira_linha}{sufixo}"
                elif tags_match:
                    detail = f" - Intervenção: {tags_match[-1].title()}"

            events.append({
                "data": entry["timestamp"],
                "tipo": "governança",
                "label": f"Gov: {entry['user']}{detail}",
                "impacto": "neutro"
            })
        
        # Ordenação e Limite
        events.sort(key=lambda x: x["data"], reverse=True)
        self.timeline = events[:12] # Limite de densidade

    def _build_causal_chain(self):
        if self.falso_movimento:
            self.evidencias.append("Falso movimento detectado: entregas recentes não reduzem backlog.")
        if self.aging_medio > 14:
            self.evidencias.append(f"Backlog envelhecido (+{int(self.aging_medio)}d média).")
        if not self.entregas_recentes and self.entregas_atrasadas:
            self.evidencias.append("Inércia operacional: zero entregas nos últimos 15 dias.")
        self.evidencias = self.evidencias[:3]

    def to_dict(self) -> Dict[str, Any]:
        return self._calculated_data

    def _to_dict_internal(self) -> Dict[str, Any]:
        snapshot = SnapshotManager.get_last_snapshot("projeto", self.projeto.id_projeto)
        audit_history = AuditManager.get_history("projeto", self.projeto.id_projeto)
        
        # Cadeia Causal Factual
        cadeia = []
        if self.entregas_atrasadas:
            cadeia.append(f"{len(self.entregas_atrasadas)} atrasos acumulados elevaram a tensão operacional.")
        if self.falso_movimento:
            cadeia.append("Entregas recentes não reduziram o backlog, caracterizando falso movimento.")
        if self.overrides:
            cadeia.append("Intervenção de governança modulou a interpretação factual dos dados.")
        
        # Dias sem movimento real (última entrega real ou data início)
        last_action_date = self.projeto.data_inicio
        if self.entregas_concluidas:
            reais = [e.data_entrega_real for e in self.entregas_concluidas if e.data_entrega_real]
            if reais: last_action_date = max(reais)
        
        dias_sem_movimento = (self.hoje - last_action_date).days
        
        return {
            "ritmo_operacional": self.ritmo,
            "fase_operacional": self.fase,
            "evidencias": self.evidencias,
            "evidencias_resumidas": self.evidencias[:2],
            "cadeia_causal": cadeia[:3],
            "impacto_do_override": "Prioridade humana sobrepõe métricas algorítmicas" if self.overrides else "Processamento analítico puro",
            "audit_history_resumo": audit_history[-5:],
            "motivo_auditavel": self.overrides.get("motivo") or (self.evidencias[0] if self.evidencias else "Estabilidade factual."),
            "motivo_auditavel_resumido": (self.overrides.get("motivo") or (self.evidencias[0] if self.evidencias else "Estável"))[:60],
            "override_ativo": bool(self.overrides),
            "interpretacao_manual_ativa": bool(self.overrides),
            "is_estagnado": "crise" in self.fase or "travada" in self.fase or dias_sem_movimento > 30,
            "score_tensao": len(self.entregas_atrasadas) * 12,
            "score_operacional": max(0, 100 - (len(self.entregas_atrasadas) * 10 + int(self.aging_medio))),
            "percentual_conclusao": self.percentual_conclusao,
            "nivel_tensao": "crítico" if len(self.entregas_atrasadas) > 3 or self.aging_medio > 20 else "nominal",
            "motivo_tensao": "Atrasos recorrentes" if self.entregas_atrasadas else "Estável",
            "count_atrasos": len(self.entregas_atrasadas),
            "dias_sem_progresso": int(self.aging_medio),
            "dias_sem_movimento": dias_sem_movimento,
            "motivo_estagnacao": "Inércia operacional prolongada" if dias_sem_movimento > 21 else None,
            "motivo_ritmo": "Ritmo condicionado a atrasos" if self.entregas_atrasadas else "Fluxo nominal",
            "tendencia_tensao": "alta" if self.entregas_atrasadas and not self.entregas_recentes else "estável",
            "tendencia": "queda" if self.entregas_recentes and not self.entregas_atrasadas else "estável",
            "reincidencia": "Atrasos recorrentes detectados" if len(self.entregas_atrasadas) > 2 else None,
            "backlog_meta": {
                "aging_medio": int(self.aging_medio),
                "itens_criticos": len([a for a in self.aging_data if a["dias"] > 15])
            },
            "timeline": self.timeline,
            "esforco_vs_resultado": self.esforco,
            "falso_movimento": self.falso_movimento,
            "desgaste_longitudinal": "alto" if len(self.projeto.contrato.eventos_criticos if self.projeto.contrato else []) > 3 else "mínimo",
            "snapshot_recente": snapshot.get("data_snapshot") if snapshot else None
        }

    def to_dict(self) -> Dict[str, Any]:
        return self._calculated_data
