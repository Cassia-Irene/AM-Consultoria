import random
from datetime import datetime, date, timedelta

# Inicializar seed fixa para garantir determinismo nas simulações
# Assim a "história" gerada será a mesma a cada execução,
# mas sempre ancorada na data de hoje para manter o dashboard "vivo".
random.seed(42)

def get_hoje() -> datetime:
    return datetime.now()

def get_hoje_date() -> date:
    return get_hoje().date()

def subtrair_meses(data: date, meses: int) -> date:
    # Função simples para voltar meses (aproximadamente 30 dias por mês)
    return data - timedelta(days=30 * meses)

def data_relativa_dias(dias: int) -> datetime:
    """Retorna data/hora com offset de dias. Negativo = passado, Positivo = futuro"""
    return get_hoje() + timedelta(days=dias)

def data_relativa_horas(horas: int) -> datetime:
    """Retorna data/hora com offset de horas. Negativo = passado"""
    return get_hoje() + timedelta(hours=horas)

def gerar_id_unico(tabela: str) -> int:
    """Simula um auto-increment ou apenas retorna um número fixo baseado num contador (pode ser substituído por lógicas mais seguras)."""
    # Para o Seed, vamos apenas deixar os IDs serem definidos pelas próprias entidades ou usar um contador.
    pass

# ---- GRAFO CAUSAL (EVENT GRAPH) ----

def create_causal_pendency(visita, descricao, responsavel="Equipe", dias_prazo=3, atrasada=False):
    """Cria uma pendência explicitamente amarrada a uma visita (Causalidade)."""
    from src.models import Pendencia
    data_origem = visita.data_hora
    
    # Se for pra ser atrasada, o prazo tem que ser no passado.
    # Se data_origem já for no passado longo, o prazo normal pode já estar vencido.
    # Vamos simplificar:
    if atrasada:
        data_prazo = data_origem + timedelta(days=1)
        resolvida = False
    else:
        data_prazo = data_origem + timedelta(days=dias_prazo)
        # Se prazo for menor que hoje, está atrasada passivamente
        resolvida = data_prazo < get_hoje()

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

def create_causal_event(visita, tipo_evento, descricao, impacto="Médio", resolvido=True):
    """Cria um evento crítico amarrado a uma visita anômala."""
    from src.models import EventoCritico
    return EventoCritico(
        id_contrato=visita.id_contrato,
        id_visita=visita.id_visita,
        data_evento=visita.data_hora,
        tipo_evento=tipo_evento,
        descricao=descricao,
        impacto_operacional=impacto,
        resolvido=resolvido
    )

def apply_stress_limits(lista_eventos, max_items=5):
    """Aplica o 'cap de ruído' para evitar saturação da UI no modo Stress."""
    return lista_eventos[:max_items]

