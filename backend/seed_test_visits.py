from src.database import SessionLocal
from sqlalchemy import text
from datetime import datetime, timedelta

db = SessionLocal()
try:
    # 1. Lar São Francisco (Contrato 45)
    # 2. Creche Sonho de Criança (Contrato 46)
    
    clients = [
        {
            "id": 45, 
            "nome": "Lar São Francisco", 
            "hist_res": "Identificado vazamento na ala norte. Pendência aberta.",
            "desc": "Visita de Emergência",
            "p_desc": "Vazamento Ala Norte"
        },
        {
            "id": 46, 
            "nome": "Creche Sonho de Criança", 
            "hist_res": "Protocolo de higiene da cozinha revisado com a equipe.",
            "desc": "Visita Rotineira Semanal",
            "p_desc": "Plano de ação — vigilância"
        }
    ]

    for c in clients:
        print(f"Configurando dados para {c['nome']} (ID {c['id']})")
        
        # Inserir Histórico (Para aparecer no 'Última Visita')
        db.execute(text("""
            INSERT INTO visitas (id_contrato, status, data_hora, tipo_visita, modalidade, descricao, resultados, duracao_minutos)
            VALUES (:id, 'concluida', '2026-05-01 10:00:00', 'rotineira', 'presencial', 'Auditoria Anterior', :res, 60)
        """), {"id": c['id'], "res": c['hist_res']})

        # Inserir Visita de HOJE
        db.execute(text("""
            INSERT INTO visitas (id_contrato, status, data_hora, tipo_visita, modalidade, descricao, duracao_minutos)
            VALUES (:id, 'pendente', CURRENT_TIMESTAMP, 'rotineira', 'presencial', :desc, 45)
        """), {"id": c['id'], "desc": c['desc']})

        # Inserir Pendência (Para o badge e lista 'Em Aberto')
        db.execute(text("""
            INSERT INTO pendencias (id_contrato, descricao, responsavel, data_origem, resolvida, data_prazo)
            VALUES (:id, :p_desc, 'Coordenação', CURRENT_DATE, false, CURRENT_DATE + INTERVAL '7 days')
        """), {"id": c['id'], "p_desc": c['p_desc']})

    db.commit()
    print("Sucesso: Dados de teste diversificados e corrigidos.")
except Exception as e:
    db.rollback()
    print(f"Erro: {e}")
finally:
    db.close()
