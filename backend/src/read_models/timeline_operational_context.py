from datetime import date, timedelta
from typing import List, Dict, Any
from src.models.visita import Visita
from src.models.pendencia import Pendencia

class TimelineOperationalContext:
    """
    Read Model avançado para gerar Causalidade e Memória de Eventos na Timeline.
    Transforma registros isolados em fluxo narrativo.
    """
    
    def __init__(self, visitas: List[Visita], pendencias: List[Pendencia]):
        self.visitas = visitas
        self.pendencias = pendencias
        self.hoje = date.today()
        self._analyze()

    def _analyze(self):
        # 1. Agrupamento por Janelas Temporais (Detecção de Caos)
        # Se temos mais de 3 eventos (visitas/pendências) em um período de 48h
        self.janelas_de_caos = self._detect_chaos_windows()
        
        # 2. Causalidade (Sequência lógica)
        # Ex: Visita -> Pendência Gerada -> Outra Visita
        self.causalidade = self._infer_causality()
        
        # 3. Resumo Narrativo
        self.resumo = self._generate_narrative()

    def _detect_chaos_windows(self) -> List[Dict[str, Any]]:
        # Simplificação: Agrupamos por data
        eventos_por_data = {}
        for v in self.visitas:
            d = v.data_hora.date() if not isinstance(v.data_hora, str) else date.fromisoformat(v.data_hora[:10])
            eventos_por_data[d] = eventos_por_data.get(d, 0) + 1
        for p in self.pendencias:
            d = p.data_origem
            if d: eventos_por_data[d] = eventos_por_data.get(d, 0) + 1
            
        windows = []
        for d, count in eventos_por_data.items():
            if count >= 3:
                windows.append({"data": d, "intensidade": count, "tipo": "pico_operacional"})
        return windows

    def _infer_causality(self) -> List[str]:
        narrative_links = []
        # Exemplo de causalidade: Se houve uma visita urgente e depois pendências
        # Pegamos os últimos 7 dias
        recent_threshold = self.hoje - timedelta(days=7)
        visitas_recentes = [v for v in self.visitas if (v.data_hora.date() if not isinstance(v.data_hora, str) else date.fromisoformat(v.data_hora[:10])) >= recent_threshold]
        pendencias_recentes = [p for p in self.pendencias if p.data_origem and p.data_origem >= recent_threshold]
        
        if visitas_recentes and pendencias_recentes:
            narrative_links.append(f"Fluxo causal detectado: {len(visitas_recentes)} visitas geraram {len(pendencias_recentes)} novas demandas.")
            
        # Detecção de Silêncio Perigoso
        if not visitas_recentes and self.hoje.weekday() < 5: # Se é dia de semana e não teve visita
            narrative_links.append("Alerta de Silêncio: Contrato sem interações de campo nos últimos 7 dias.")
            
        return narrative_links

    def _generate_narrative(self) -> str:
        if self.janelas_de_caos:
            return f"Período marcado por picos operacionais ({len(self.janelas_de_caos)} janelas de alta demanda)."
        if self.causalidade:
            return self.causalidade[0]
        return "Sequência operacional estável."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "janelas_de_caos": self.janelas_de_caos,
            "causalidade": self.causalidade,
            "resumo_narrativo": self.resumo,
            "status_timeline": "turbulenta" if self.janelas_de_caos else "normal"
        }
