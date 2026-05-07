from sqlalchemy.orm import Session
from src.models import Cliente, Contato, Contrato, Projeto, Visita, Pendencia, FaturamentoCliente, EventoCritico
from seeds.scenarios import (
    HomeCareScenario,
    APAEScenario,
    CAPSScenario,
    ILPIScenario,
    FarmaciaScenario,
    CrecheScenario,
    ReabilitaScenario
)

def clear_timeline(db: Session):
    """Limpa apenas os dados dinâmicos da linha do tempo, mantendo a estrutura."""
    print("[SEED] Limpando linha do tempo (Eventos, Pendências, Faturamentos, Visitas)...")
    db.query(EventoCritico).delete()
    db.query(Pendencia).delete()
    db.query(FaturamentoCliente).delete()
    db.query(Visita).delete()
    db.commit()

def clear_structure(db: Session):
    """Limpa a base estrutural (Clientes e Contratos). Deve ser chamado DEPOIS de clear_timeline."""
    print("[SEED] Limpando base estrutural (Contratos, Clientes)...")
    db.query(Projeto).delete()
    db.query(Contrato).delete()
    db.query(Contato).delete()
    db.query(Cliente).delete()
    db.commit()

def run_all(db: Session, mode: str = "realistic"):
    """Orquestrador principal: Executa estrutura e simulação na ordem correta."""
    try:
        # 1. Limpeza garantida na ordem reversa
        clear_timeline(db)
        clear_structure(db)

        print(f"[SEED] Inicializando Simulador Operacional (Modo: {mode.upper()})...")

        scenarios = [
            ILPIScenario(db),
            CrecheScenario(db),
            CAPSScenario(db),
            HomeCareScenario(db),
            ReabilitaScenario(db),
            APAEScenario(db),
            FarmaciaScenario(db)
        ]

        # 2. Gerar Estrutura
        print("[SEED] Nível 1: Gerando Base Estrutural...")
        estruturas = []
        for scenario in scenarios:
            cliente, contrato = scenario.generate_structure()
            estruturas.append((scenario, cliente, contrato))

        # 3. Simular Linha do Tempo
        print(f"[SEED] Nível 2: Simulando Linha do Tempo ({mode})...")
        for scenario, cliente, contrato in estruturas:
            nome_cenario = scenario.__class__.__name__
            print(f"  -> Simulando {nome_cenario} para {cliente.nome}")
            scenario.simulate_timeline(cliente, contrato, mode)

        print("[SEED] Simulação Operacional concluída com sucesso!")

    except Exception as e:
        print(f"[SEED][ERRO] Falha durante a simulação: {str(e)}")
        db.rollback()
        raise e

