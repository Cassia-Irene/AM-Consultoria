from datetime import date
from typing import List
from src.models.projeto import Projeto

def calculate_project_tension(projeto: Projeto) -> dict:
    """
    Calcula a tensão operacional de um projeto específico.
    Regra: (Entregas Atrasadas * 2) + Eventos Críticos do Contrato
    """
    score = 0
    hoje = date.today()
    
    # 1. Atrasos
    atrasos = 0
    entregas = getattr(projeto, "entregas", [])
    for e in entregas:
        
        is_entregue = getattr(e, "entregue", False)
        prevista = getattr(e, "data_entrega_prevista", None)
        if not is_entregue and prevista and prevista < hoje:
            atrasos += 1
    
    score += (atrasos * 2)
    
    # 2. Crises
    contrato = getattr(projeto, "contrato", None)
    crises = len(getattr(contrato, "eventos_criticos", [])) if contrato else 0
    score += crises
    
    nivel = "Baixa"
    if score > 5: nivel = "Crítica"
    elif score > 2: nivel = "Moderada"
    
    return {
        "score": score,
        "nivel": nivel,
        "count_atrasos": atrasos,
        "count_crises": crises
    }
