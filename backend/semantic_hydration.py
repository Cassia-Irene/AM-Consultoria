from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
import random
from src.models import Projeto, Entrega, EventoCritico, Visita, Contrato, Cliente

# Configurações de Janela Temporal
BASE_DATE = date(2026, 5, 12)
START_DATE = date(2025, 11, 12)
END_DATE = date(2026, 6, 12)

def get_profile(cliente_nome: str) -> str:
    nome = cliente_nome.lower()
    if "lar são francisco" in nome: return "LAR"
    if any(x in nome for x in ["caps", "apae", "cuidabem"]): return "MICRO"
    return "MACRO" # Farmácia, Creche, Reabilita

PROJECT_MILESTONES = {
    "Revisão do fluxo de medicação": [
        "Mapeamento de riscos de dispensação", "Treinamento: Protocolo de 5 certos", 
        "Implementação de ficha de controle", "Auditoria de estoque inicial", 
        "Validar armazenamento de psicotrópicos", "Revisão de prontuários"
    ],
    "Organização documental para VISA": [
        "Checklist de conformidade", "Dossiê técnico", "Regularização de alvará",
        "Atestados de treinamento", "Manual de Boas Práticas", "Plano de Gerenciamento de Resíduos"
    ],
    "Revisão do fluxo RAAS": [
        "Auditoria de prontuários ativos", "Cruzamento RAAS x Atendimento",
        "Treinamento de preenchimento", "Implementação de fluxo de glosa zero",
        "Validação de faturamento mensal"
    ],
    "Redesenho da escala de plantão": [
        "Mapeamento de horas extras", "Acordo de banco de horas",
        "Escala de feriados e folgas", "Implementação de sistema de ponto",
        "Monitoramento de absenteísmo"
    ],
    "Controle de dispensação": [
        "Layout de estoque", "Inventário rotativo", "Segregação de vencidos",
        "Treinamento de balcão", "Sistema de perdas"
    ]
}

CRITICAL_EVENTS = {
    "LAR": [
        "Tensão Institucional: Ruptura de confiança com equipe noturna",
        "Incidente: Queda de residente sem registro imediato",
        "Bloqueio: Direção relutante em implementar protocolo de medicação",
        "Crise: Familiares questionando conduta técnica"
    ],
    "MICRO": [
        "Gargalo: Acúmulo de prontuários sem assinatura técnica",
        "Erro Operacional: Falha na escala gerando dobra de turno",
        "Risco Sanitário: Medicamento vencido encontrado em estoque ativo",
        "Conflito: Resistência da equipe assistencial às novas metas"
    ],
    "MACRO": [
        "Atraso Estratégico: Aguardando aprovação de orçamento para reforma",
        "Risco Contratual: Cliente questionando valor de visitas extras",
        "Pausa Operacional: Mudança de gestão interna pausou o projeto",
        "Divergência: Diferença entre estoque físico e contábil"
    ]
}

def enrich_operational_data(db: Session):
    print(f"\n[DENSIDADE] Iniciando enriquecimento operacional ({START_DATE} -> {END_DATE})")
    
    projetos = db.query(Projeto).all()
    for proj in projetos:
        # 1. Gerar Entregas (Cronograma Irregular)
        milestones = PROJECT_MILESTONES.get(proj.titulo, [
            f"Etapa 1: {proj.titulo}", f"Etapa 2: {proj.titulo}", 
            f"Etapa 3: {proj.titulo}", f"Validação: {proj.titulo}"
        ])
        
        current_date = proj.data_inicio
        profile = get_profile(proj.contrato.cliente.nome)
        
        for i, m_desc in enumerate(milestones):
            # Adiciona irregularidade no tempo
            if profile == "MICRO":
                gap = random.randint(7, 15)
            elif profile == "LAR":
                gap = random.randint(15, 30)
            else:
                gap = random.randint(20, 45)
            
            due_date = current_date + timedelta(days=gap)
            current_date = due_date # Cascata
            
            # Se a data prevista já passou e estamos no passado da simulação
            is_past = due_date < BASE_DATE
            
            # Lógica de entrega: Algumas concluídas, algumas atrasadas, algumas futuras
            entregue = False
            data_real = None
            
            if is_past:
                # 80% de chance de estar entregue se for antigo
                if random.random() > 0.2:
                    entregue = True
                    # Atraso ou adiantamento na entrega real
                    data_real = due_date + timedelta(days=random.randint(-3, 10))
            
            # Garantir que não duplicamos
            exists = db.query(Entrega).filter_by(id_projeto=proj.id_projeto, descricao=m_desc).first()
            if not exists:
                db.add(Entrega(
                    id_projeto=proj.id_projeto,
                    descricao=m_desc,
                    data_entrega_prevista=due_date,
                    data_entrega_real=data_real,
                    entregue=entregue
                ))
                print(f"  [ENTREGA] {proj.contrato.cliente.nome[:15]}... -> {m_desc}")

    db.commit()

    # 2. Gerar Eventos Críticos (Causais e Agrupados)
    contratos = db.query(Contrato).all()
    for contrato in contratos:
        profile = get_profile(contrato.cliente.nome)
        
        # Buscar visitas deste contrato para ancorar eventos
        visitas = db.query(Visita).filter_by(id_contrato=contrato.id_contrato).all()
        
        # Quantidade de eventos baseada no perfil
        num_eventos = random.randint(1, 3) if profile == "LAR" else random.randint(0, 2)
        
        for _ in range(num_eventos):
            event_template = random.choice(CRITICAL_EVENTS[profile])
            
            # Escolher uma data aleatória no passado (foco em meses de tensão)
            days_ago = random.randint(30, 150)
            event_date = BASE_DATE - timedelta(days=days_ago)
            
            # Tentar associar a uma visita próxima (causalidade)
            id_visita = None
            visita_proxima = next((v for v in visitas if abs((v.data_hora.date() - event_date).days) < 3), None)
            if visita_proxima:
                id_visita = visita_proxima.id_visita
            
            # Ação tomada (Cadeia Causal)
            acao = None
            if event_date < BASE_DATE - timedelta(days=20):
                acao = "Resolvido via nova rodada de treinamentos e ajuste de fluxo."
            
            exists = db.query(EventoCritico).filter_by(id_contrato=contrato.id_contrato, descricao=event_template).first()
            if not exists:
                db.add(EventoCritico(
                    id_contrato=contrato.id_contrato,
                    id_visita=id_visita,
                    data_evento=event_date,
                    descricao=event_template,
                    acao_tomada=acao
                ))
                print(f"  [CRÍTICO] {contrato.cliente.nome[:15]}... -> {event_template}")

    db.commit()
    print("[DENSIDADE] Enriquecimento concluído.\n")

# Aliases para compatibilidade
def hydrate_entities(db: Session):
    return {}

def simulate_history(db: Session, client_data=None):
    enrich_operational_data(db)

if __name__ == "__main__":
    from src.database import SessionLocal
    db = SessionLocal()
    try:
        enrich_operational_data(db)
    finally:
        db.close()
