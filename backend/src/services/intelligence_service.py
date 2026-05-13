from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date
from src.services.analytics_service import AnalyticsService

class IntelligenceService:
    @classmethod
    def get_global_attention(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Produz o payload consolidado de Atenção Global.
        Foco 100% em Entregas, Bloqueios e Estagnação.
        Retorna em CamelCase para o Frontend.
        """
        raw_health = AnalyticsService.get_client_health(db)
        
        attention_list = []
        for client in raw_health:
            cid = client['id_contrato']
            
            # --- DADOS OPERACIONAIS REAIS ---
            eventos_ativos = client.get('eventos_ativos', 0)
            progresso_medio = int(client.get('progresso_medio', 0))
            ultima_entrega = client.get('ultima_entrega_data')
            
            if ultima_entrega:
                if isinstance(ultima_entrega, str):
                    ultima_entrega = date.fromisoformat(ultima_entrega)
                dias_sem_entrega = (date.today() - ultima_entrega).days
            else:
                dias_sem_entrega = 99
            
            # --- LÓGICA DE ESTADO OPERACIONAL ---
            state = client.get('status_operacional', 'normal')
            
            # Narrativa baseada em fatos
            if state == "emergência":
                summary = f"OPERAÇÃO EM CRISE: {eventos_ativos} evento(s) crítico(s) sem ação."
            elif state == "atenção":
                summary = f"ATENÇÃO: Estagnação de entregas ({dias_sem_entrega} dias) ou baixo progresso."
            else:
                summary = "Operação fluindo conforme o planejado."

            value_narrative = f"Avanço Checklist: {progresso_medio}% | Última entrega há {dias_sem_entrega} dias."
            
            # DECISÃO DE ATENÇÃO
            if state != "normal":
                attention_list.append({
                    "cliente": client['cliente'],
                    "idContrato": cid,
                    "progressoReal": progresso_medio,
                    "eventosAtivos": eventos_ativos,
                    "state": state,
                    "stagnationRisk": dias_sem_entrega > 21,
                    "lastDeliveryDays": dias_sem_entrega,
                    "summary": summary,
                    "valueNarrative": value_narrative,
                    "statusOperacional": state
                })
        
        # ORDENAÇÃO: Emergência > Atenção
        priority_map = {"emergência": 3, "atenção": 2, "normal": 1}
        return sorted(attention_list, key=lambda x: (priority_map.get(x['state'], 0), x['lastDeliveryDays']), reverse=True)
