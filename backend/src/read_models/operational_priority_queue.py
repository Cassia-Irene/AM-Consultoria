from datetime import date
from typing import List, Dict, Any, Optional
from src.models.pendencia import Pendencia

class OperationalPriorityQueue:
    """
    Fila de Prioridade Final: Controle de Fadiga e Hierarquia de Criticidade.
    Evita excesso de alertas simultâneos (Ruído vs Sinal).
    """
    
    def __init__(self, pendencias: List[Pendencia]):
        self.pendencias = pendencias
        self.hoje = date.today()

    def to_list(self) -> List[Dict[str, Any]]:
        scored = []
        for p in self.pendencias:
            if p.resolvida: continue
            
            score, motivo = self._calculate_pragmatic_score(p)
            scored.append({
                "id": p.id_pendencia,
                "score": score,
                "motivo": motivo,
                "descricao": p.descricao,
                "data_prazo": p.data_prazo
            })
            
        # Ordenação por score decrescente
        ordered = sorted(scored, key=lambda x: x["score"], reverse=True)
        
        # Controle de Fadiga: Se temos muitas pendências, agrupamos por criticidade
        
        return self._apply_fatigue_control(ordered)

    def _calculate_pragmatic_score(self, p: Pendencia) -> tuple[int, str]:
        score = 0
        motivo = ""
        
        # Atraso (Peso Pragmático)
        if p.data_prazo:
            dias_atraso = (self.hoje - p.data_prazo).days
            if dias_atraso > 0:
                score += min(50, dias_atraso * 5)
                motivo = f"Atraso de {dias_atraso} dias"
            elif dias_atraso == 0:
                score += 30
                motivo = "Vence hoje"
            elif dias_atraso >= -2:
                score += 15
                motivo = "Vence em breve"
        
        # Importância Contextual (Se mencionada no título)
        desc = p.descricao.lower()
        if "urgente" in desc or "crítico" in desc or "imediato" in desc:
            score += 20
            motivo += " | Marcada como urgente"
            
        return score, (motivo or "Planejamento normal")

    def _apply_fatigue_control(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Se houver mais de 5 itens de alta prioridade, começamos a colapsar redundâncias
        high_priority = [i for i in items if i["score"] >= 40]
        
        if len(high_priority) > 5:
            # Mantemos os top 3 intactos
            for i in range(3, len(items)):
                if items[i]["score"] >= 40:
                    items[i]["score"] = 39 # Rebaixa levemente para tirar do topo absoluto
                    
        return items

    def get_top_1(self) -> Optional[Dict[str, Any]]:
        res = self.to_list()
        return res[0] if res else None
