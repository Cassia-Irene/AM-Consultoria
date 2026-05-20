from datetime import date, datetime
from typing import List, Optional
from src.models.visita import Visita
from src.models.pendencia import Pendencia
from src.models.contrato import Contrato

def get_tipo_operacional_visita(visita: Visita) -> str:
    """
    Heurística para classificar o tipo operacional da visita.
    """
    desc = (visita.descricao or "").lower()
    
    # Horário
    dt = visita.data_hora
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    
    is_fora_horario = dt.hour < 8 or dt.hour >= 18 or dt.weekday() >= 5
    
    k_urgente = ['emergência', 'urgente', 'socorro', 'crítico', 'parou', 'problema', 'imediato']
    k_admin = ['relatório', 'reunião', 'alinhamento', 'secretaria', 'documento', 'anvisa', 'vigilância']
    
    if is_fora_horario or any(k in desc for k in k_urgente):
        return "emergencial"
    if any(k in desc for k in k_admin):
        return "administrativo"
    if visita.id_projeto:
        return "projeto"
    
    return "rotina"

def calculate_client_health_score(
    contrato: Contrato,
    visitas: List[Visita],
    pendencias_abertas: List[Pendencia]
) -> dict:
    """
    Calcula KPIs de saúde operacional do cliente.
    """
    # 1. Índice de Urgência
    emergenciais = [v for v in visitas if get_tipo_operacional_visita(v) == "emergencial"]
    # Pendências urgentes
    urgentes = [p for p in pendencias_abertas if p.data_prazo and p.data_prazo < date.today()]
    
    indice_urgencia = min(100, (len(emergenciais) * 20) + (len(urgentes) * 15))
    
    # 2. Taxa de Goodwill
    limite_mensal = contrato.visitas_previstas_mes or 4
    taxa_goodwill = max(0, (len(visitas) - limite_mensal) / max(1, len(visitas)) * 100)
    
    # 3. Índice de Desgaste
    # Integrar inadimplência aqui quando o modelo financeiro estiver estável
    indice_desgaste = min(100, (indice_urgencia * 0.5) + (taxa_goodwill * 0.3))
    
    perfil = "equilibrado"
    if indice_desgaste > 70: perfil = "drenante"
    elif indice_urgencia > 60: perfil = "urgente"
    elif taxa_goodwill > 40: perfil = "alto_goodwill"
    
    return {
        "id_contrato": contrato.id_contrato,
        "indice_urgencia": int(indice_urgencia),
        "indice_desgaste": int(indice_desgaste),
        "taxa_goodwill": int(taxa_goodwill),
        "perfil": perfil,
        "carga_operacional": len(visitas) + len(pendencias_abertas)
    }
