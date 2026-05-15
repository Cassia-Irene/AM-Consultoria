from sqlalchemy.orm import Session
from src.models import (
    Cliente, Contato, Contrato, Projeto, Visita, Pendencia, 
    FaturamentoCliente, EventoCritico, ContratoPagamento, 
    ProjetoParcela, ProjetoExtra, Entrega, VisitaExtra,
    HistoricoContrato, TipoPagamento
)
from seeds.scenarios import (
    HomeCareScenario,
    APAEScenario,
    CAPSScenario,
    ILPIScenario,
    FarmaciaScenario,
    CrecheScenario,
    ReabilitaScenario
)
from semantic_hydration import hydrate_entities, simulate_history

def clear_all(db: Session):
    """Limpa todo o banco respeitando a ordem de chaves estrangeiras."""
    # Desativado a pedido do usuário para preservar dados existentes e apenas densificar.
    print("[SEED] Ignorando limpeza de banco (Preservando dados)...")
    pass

def run_all(db: Session, mode: str = "realistic"):
    """Orquestrador principal: Complementa a hidratação semântica."""
    try:
        # clear_all(db) # Preservar dados existentes

        print(f"\n[SEED] >>> INICIANDO MOTOR DE DENSIFICAÇÃO ({mode.upper()}) <<<\n")

        # Fase 1 e 2 desativadas pois o banco já está populado com a estrutura base.
        # scenarios = [...]
        
        # 3. Hidratação Semântica (Vida de 6 meses)
        print("\n[SEED] Fase 3: Injetando Hidratação Semântica (Densificação de Entregas e Eventos)...")
        # hydrate_entities agora retorna {} pois vamos trabalhar sobre o que já existe no DB.
        client_data = hydrate_entities(db)
        simulate_history(db, client_data)

        print("\n[SEED] >>> DENSIFICAÇÃO OPERACIONAL CONCLUÍDA COM SUCESSO! <<<\n")

    except Exception as e:
        print(f"\n[SEED][ERRO FATAL] Falha durante a simulação: {str(e)}")
        db.rollback()
        raise e
