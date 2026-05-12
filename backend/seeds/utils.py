import random
from datetime import datetime, date, timedelta
from src.models import (
    Pendencia, EventoCritico, TipoPagamento, Projeto, 
    Entrega, ProjetoParcela, HistoricoContrato, ContratoPagamento,
    Contato, VisitaExtra
)

# Inicializar seed fixa para garantir determinismo nas simulações
random.seed(42)

def get_hoje() -> datetime:
    # Fixar uma data de referência para a simulação ser reprodutível
    return datetime(2026, 5, 10, 10, 0, 0)

def get_hoje_date() -> date:
    return get_hoje().date()

def subtrair_meses(data: date, meses: int) -> date:
    # Função simples para voltar meses (aproximadamente 30 dias por mês)
    return data - timedelta(days=30 * meses)

def data_relativa_dias(dias: int) -> date:
    """Retorna data (date) com offset de dias. Negativo = passado, Positivo = futuro"""
    return (get_hoje() + timedelta(days=dias)).date()

def data_relativa_datetime(dias: int) -> datetime:
    """Retorna data/hora (datetime) com offset de dias."""
    return get_hoje() + timedelta(days=dias)

# ---- GRAFO CAUSAL (EVENT GRAPH) ----

def create_causal_pendency(visita, descricao, responsavel="Equipe", dias_prazo=3, atrasada=False):
    """Cria uma pendência explicitamente amarrada a uma visita (Causalidade)."""
    data_origem = visita.data_hora.date()
    
    if atrasada:
        data_prazo = data_origem + timedelta(days=1)
        resolvida = False
    else:
        data_prazo = data_origem + timedelta(days=dias_prazo)
        # Se data_prazo < hoje, consideramos resolvida para não poluir o dashboard de atrasos
        resolvida = data_prazo < get_hoje_date()

    return Pendencia(
        id_contrato=visita.id_contrato,
        id_visita=visita.id_visita,
        descricao=descricao,
        responsavel=responsavel,
        data_origem=data_origem,
        data_prazo=data_prazo,
        resolvida=resolvida,
        data_resolucao=data_prazo if resolvida else None
    )

def create_causal_event(visita, descricao, acao_tomada=None):
    """Cria um evento crítico amarrado a uma visita anômala."""
    return EventoCritico(
        id_contrato=visita.id_contrato,
        id_visita=visita.id_visita,
        data_evento=visita.data_hora.date(),
        descricao=descricao,
        acao_tomada=acao_tomada
    )

def ensure_tipos_pagamento(db):
    """Garante que os tipos de pagamento padrão existam."""
    tipos = ["Mensal", "Por Visita", "Por Projeto", "Mensal + Projetos paralelos"]
    results = {}
    for t in tipos:
        tp = db.query(TipoPagamento).filter(TipoPagamento.tipo.ilike(t)).first()
        if not tp:
            tp = TipoPagamento(tipo=t)
            db.add(tp)
            db.flush()
        results[t.lower()] = tp
    return results

def apply_stress_limits(lista, max_items=5):
    """Aplica o 'cap de ruído' para evitar saturação da UI."""
    return lista[:max_items]
