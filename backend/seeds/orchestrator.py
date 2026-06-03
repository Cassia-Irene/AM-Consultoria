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

def clear_all(db: Session, force: bool = False):
    """Limpa todo o banco respeitando a ordem de chaves estrangeiras."""
    if not force:
        print("[SEED] Ignorando limpeza de banco (Preservando dados)...")
        return

    print("[SEED] Limpando banco de dados (Forçado)...")
    
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

def run_all(db: Session, mode: str = "realistic", fresh: bool = False):
    """Orquestrador principal: Cria a estrutura base se o banco estiver vazio/teste ou fresh=True."""
    try:
        # Busca clientes para verificar se o banco está vazio ou apenas com teste
        clients = db.query(Cliente).all()
        is_empty_or_test = len(clients) == 0 or (len(clients) == 1 and clients[0].nome.lower() == 'cliente teste')

        should_populate_all = fresh or is_empty_or_test

        if should_populate_all:
            # Se tiver dados (como 'Cliente teste') e for rodar completo, limpa antes
            if len(clients) > 0:
                clear_all(db, force=True)
            else:
                # Garante que tipos_pagamento sejam recriados se o banco estiver 100% vazio
                clear_all(db, force=True)

            print(f"\n[SEED] >>> INICIANDO MOTOR DE POPULAÇÃO COMPLETO ({mode.upper()}) <<<\n")
            
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
        else:
            print(f"\n[SEED] >>> DETECTADO BANCO JÁ POPULADO: INICIANDO MOTOR DE DENSIFICAÇÃO ({mode.upper()}) <<<\n")

        # 3. Hidratação Semântica (Vida de 6 meses)
        print("\n[SEED] Fase 3: Injetando Hidratação Semântica (Densificação de Entregas e Eventos)...")
        client_data = hydrate_entities(db)
        simulate_history(db, client_data)

        print("\n[SEED] >>> POPULAÇÃO/DENSIFICAÇÃO CONCLUÍDA COM SUCESSO! <<<\n")

    except Exception as e:
        print(f"\n[SEED][ERRO FATAL] Falha durante a simulação: {str(e)}")
        db.rollback()
        raise e


