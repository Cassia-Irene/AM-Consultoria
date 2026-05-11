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

def clear_all(db: Session):
    """Limpa todo o banco respeitando a ordem de chaves estrangeiras."""
    print("[SEED] Limpando banco de dados...")
    
    # Ordem reversa de dependência
    db.query(EventoCritico).delete()
    db.query(Pendencia).delete()
    db.query(VisitaExtra).delete()
    db.query(Visita).delete()
    db.query(Entrega).delete()
    db.query(ProjetoParcela).delete()
    db.query(ProjetoExtra).delete()
    db.query(Projeto).delete()
    db.query(FaturamentoCliente).delete()
    db.query(ContratoPagamento).delete()
    db.query(HistoricoContrato).delete()
    db.query(Contrato).delete()
    db.query(Contato).delete()
    db.query(Cliente).delete()
    db.query(TipoPagamento).delete()
    db.commit()
    print("[SEED] Banco limpo com sucesso.")

def run_all(db: Session, mode: str = "realistic"):
    """Orquestrador principal: Executa estrutura e simulação na ordem correta."""
    try:
        clear_all(db)

        print(f"\n[SEED] >>> INICIANDO MOTOR DE SIMULAÇÃO ({mode.upper()}) <<<\n")

        scenarios = [
            ILPIScenario(db),
            CrecheScenario(db),
            CAPSScenario(db),
            HomeCareScenario(db),
            ReabilitaScenario(db),
            APAEScenario(db),
            FarmaciaScenario(db)
        ]

        # 1. Gerar Estrutura
        print("[SEED] Fase 1: Gerando Base Estrutural (Clientes/Contratos)...")
        estruturas = []
        for scenario in scenarios:
            cliente, contrato = scenario.generate_structure()
            estruturas.append((scenario, cliente, contrato))

        # 2. Simular Linha do Tempo
        print(f"\n[SEED] Fase 2: Simulando Linha do Tempo Dinâmica...")
        for scenario, cliente, contrato in estruturas:
            nome_cenario = scenario.__class__.__name__
            print(f"  -> Simulando {nome_cenario} para {cliente.nome}...")
            scenario.simulate_timeline(cliente, contrato, mode)

        print("\n[SEED] >>> SIMULAÇÃO OPERACIONAL CONCLUÍDA COM SUCESSO! <<<\n")

    except Exception as e:
        print(f"\n[SEED][ERRO FATAL] Falha durante a simulação: {str(e)}")
        db.rollback()
        raise e
