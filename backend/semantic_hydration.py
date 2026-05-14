from sqlalchemy.orm import Session
from datetime import date, timedelta
import random
from src.models import (
    Projeto, Entrega, EventoCritico, Visita, Contrato, Cliente, 
    Pendencia, ProjetoExtra, ProjetoParcela, Contato
)

# Configurações de Janela Temporal
BASE_DATE = date(2026, 5, 13)

ADRIANO_LEXICON = {
    "crises": [
        "Ruptura operacional: Equipe não aderiu ao novo fluxo de dispensação",
        "Tensão institucional: Direção relutante em validar protocolos",
        "Incidente: Estoque voltou inconsistente após inventário rotativo",
        "Gargalo documental: Prontuários sem assinatura técnica acumulados",
        "Conflito: Resistência da equipe assistencial às metas de produtividade",
        "Risco Sanitário: Medicamento vencido encontrado em estoque ativo",
        "Instabilidade: Alta rotatividade na enfermagem prejudicando processos",
        "Bloqueio: Falta de insumos básicos por erro de planejamento interno"
    ],
    "acoes": [
        "Treinamento emergencial realizado com foco em segurança do paciente.",
        "Reunião de alinhamento estratégico com a diretoria para destravar processos.",
        "Ajuste imediato de fluxo e implementação de dupla checagem.",
        "Auditoria completa de processos realizada após detecção de falha.",
        "Revisão de prontuários e regularização de assinaturas pendentes."
    ],
    "entregas": [
        "Mapeamento de riscos concluído",
        "Protocolo de medicação validado",
        "Dossiê técnico para VISA finalizado",
        "Fluxo de faturamento RAAS regularizado",
        "Manual de Boas Práticas implementado",
        "Inventário inicial consolidado",
        "Treinamento de equipe noturna concluído",
        "Plano de Gerenciamento de Resíduos aprovado"
    ]
}

def enrich_operational_data(db: Session):
    print(f"\n[DENSIDADE] >>> INICIANDO MOTOR DE VIDA OPERACIONAL (Base: {BASE_DATE}) <<<")
    
    # 1. IDENTIFICAÇÃO DE ATORES (Contatos)
    # Buscamos contatos reais criados pelo orchestrator anterior
    contatos = {c.id_contato: c for c in db.query(Contato).all()}
    def get_contact_for_client(client_id):
        return [c for c in contatos.values() if c.id_cliente == client_id]

    # 2. DEFINIÇÃO DE PROJETOS EXTRAS (Demandas Extraordinárias do Adriano)
    extra_configs = [
        {"id_projeto": 946, "desc": "Organização documental para VISA", "cliente": "Lar São Francisco"},
        {"id_projeto": 947, "desc": "Revisão do fluxo RAAS", "cliente": "CAPS II Renascer"},
        {"id_projeto": 949, "desc": "Estruturação de controle de cuidadores", "cliente": "CuidaBem"},
        {"id_projeto": 951, "desc": "Revisão de autorização de convênios", "cliente": "REABILITA"}
    ]

    for cfg in extra_configs:
        proj = db.query(Projeto).get(cfg["id_projeto"])
        if proj and not db.query(ProjetoExtra).filter_by(id_projeto=proj.id_projeto).first():
            client_contacts = get_contact_for_client(proj.contrato.id_cliente)
            if client_contacts:
                solicitante = client_contacts[0].id_contato
                aprovador = client_contacts[1].id_contato if len(client_contacts) > 1 else None
                db.add(ProjetoExtra(id_projeto=proj.id_projeto, solicitado_por=solicitante, aprovado_por=aprovador))
                print(f"  [EXTRA] Projeto #{proj.id_projeto} vinculado como EXTRAORDINÁRIO ({cfg['cliente']})")

    # 3. DENSIFICAÇÃO DE BACKLOG E RITMO
    projetos = db.query(Projeto).all()
    for proj in projetos:
        # Se o projeto já tem entregas, pulamos para não duplicar na densificação repetida
        if db.query(Entrega).filter_by(id_projeto=proj.id_projeto).count() > 0:
            continue
            
        # Determinar Perfil de Tensão
        # Perfil A: Estagnado/Atrasado (Muita dor)
        # Perfil B: Em Ritmo/Acelerado (Recuperação)
        # Perfil C: Novo/Limpo
        
        tension = random.choice(["high", "medium", "low"])
        
        if tension == "high":
            # 3 entregas vencidas (Backlog Acumulado)
            for j in range(3):
                prevista = BASE_DATE - timedelta(days=20 + (j*10))
                db.add(Entrega(
                    id_projeto=proj.id_projeto, 
                    descricao=random.choice(ADRIANO_LEXICON["entregas"]), 
                    data_entrega_prevista=prevista, 
                    entregue=False
                ))
            # 1 entrega futura
            db.add(Entrega(
                id_projeto=proj.id_projeto, 
                descricao="Próximo passo crítico do escopo", 
                data_entrega_prevista=BASE_DATE + timedelta(days=5), 
                entregue=False
            ))
            print(f"  [TENSÃO] Projeto #{proj.id_projeto} -> Gerado BACKLOG CRÍTICO (3 atrasadas)")
            
        elif tension == "medium":
            # 2 entregas concluídas recentemente + 1 futura
            for j in range(2):
                real = BASE_DATE - timedelta(days=15 - (j*5))
                db.add(Entrega(
                    id_projeto=proj.id_projeto, 
                    descricao=random.choice(ADRIANO_LEXICON["entregas"]), 
                    data_entrega_prevista=real, 
                    data_entrega_real=real,
                    entregue=True
                ))
            db.add(Entrega(
                id_projeto=proj.id_projeto, 
                descricao="Entrega prevista para próxima semana", 
                data_entrega_prevista=BASE_DATE + timedelta(days=7), 
                entregue=False
            ))
            print(f"  [RITMO] Projeto #{proj.id_projeto} -> Gerado FLUXO REGULAR")

    # 4. CICLO FINANCEIRO (Parcelas)
    for proj in projetos:
        if db.query(ProjetoParcela).filter_by(id_projeto=proj.id_projeto).count() > 0:
            continue
            
        # Simular 3 parcelas para cada projeto
        valor_parcela = proj.valor_total / 3
        
        # Parcela 1: Paga (Passado)
        db.add(ProjetoParcela(
            id_projeto=proj.id_projeto,
            numero_parcela=1,
            valor_parcela=valor_parcela,
            data_pagamento_prevista=BASE_DATE - timedelta(days=30),
            pago=True
        ))
        
        # Parcela 2: Depende da sorte (Pode estar vencida ou pendente)
        vencida = random.choice([True, False])
        pago = random.choice([True, False]) if not vencida else False
        
        db.add(ProjetoParcela(
            id_projeto=proj.id_projeto,
            numero_parcela=2,
            valor_parcela=valor_parcela,
            data_pagamento_prevista=BASE_DATE - timedelta(days=2 if vencida else -10),
            pago=pago
        ))
        
        # Parcela 3: Futura
        db.add(ProjetoParcela(
            id_projeto=proj.id_projeto,
            numero_parcela=3,
            valor_parcela=valor_parcela,
            data_pagamento_prevista=BASE_DATE + timedelta(days=30),
            pago=False
        ))
        
    # 5. TENSÃO INSTITUCIONAL E NARRATIVA (Descrições e Eventos)
    for proj in projetos:
        client_name = proj.contrato.cliente.nome
        extra = db.query(ProjetoExtra).filter_by(id_projeto=proj.id_projeto).first()
        
        # Enriquecer Descrição com Contexto Narrativo
        contexto = ""
        if extra:
            solicitante = contatos.get(extra.solicitado_por).nome if extra.solicitado_por in contatos else "Diretoria"
            contexto = f"PROJETO EXTRA solicitado por {solicitante}. "
            
        if "Lar São Francisco" in client_name:
            contexto += "Foco em regularização urgente para auditoria da VISA prevista para o próximo mês. Ambiente de alta pressão por prazos regulatórios."
        elif "CAPS" in client_name:
            contexto += "Demanda técnica complexa envolvendo o fluxo RAAS. Resistência moderada da equipe de enfermagem na transição de processos."
        elif "CuidaBem" in client_name:
            contexto += "Reorganização tática de escalas. Necessidade de alinhar a disponibilidade dos cuidadores com a nova política de plantão."
        else:
            contexto += "Acompanhamento rotineiro de processos para garantir a manutenção dos padrões institucionais."

        proj.descricao = contexto
        
        # Simular um evento de tensão recente para o contrato deste projeto
        if random.random() > 0.4:
            ev_date = BASE_DATE - timedelta(days=random.randint(2, 10))
            # Verificar se já existe evento nesse dia para evitar spam
            if not db.query(EventoCritico).filter_by(id_contrato=proj.id_contrato, data_evento=ev_date).first():
                db.add(EventoCritico(
                    id_contrato=proj.id_contrato,
                    data_evento=ev_date,
                    descricao=f"Tensão no Projeto: {proj.titulo}. {random.choice(ADRIANO_LEXICON['crises'])}",
                    acao_tomada="Intervenção técnica imediata realizada pelo Adriano."
                ))
            
    db.commit()
    print("\n[DENSIDADE] >>> MOTOR DE VIDA OPERACIONAL CONCLUÍDO <<<\n")

def hydrate_entities(db: Session): 
    # Agora hydrate_entities apenas orquestra o enriquecimento
    enrich_operational_data(db)
    return {}

def simulate_history(db: Session, client_data=None): 
    # Mantido para compatibilidade com o orchestrator, mas o core está em enrich_operational_data
    pass

if __name__ == "__main__":
    from src.database import SessionLocal
    db = SessionLocal()
    try:
        enrich_operational_data(db)
    finally:
        db.close()
