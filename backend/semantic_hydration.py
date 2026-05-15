from sqlalchemy.orm import Session
from datetime import date, timedelta
import random
from src.models import (
    Projeto, Entrega, EventoCritico, Visita, Contrato, Cliente, 
    Pendencia, ProjetoExtra, ProjetoParcela, Contato
)

# Configurações de Janela Temporal
BASE_DATE = date(2026, 5, 14)

def consolidate_real_projects(db: Session):
    print(f"\n[CONSOLIDAÇÃO] >>> INICIANDO CONSOLIDAÇÃO SEMÂNTICA (Base: {BASE_DATE}) <<<")
    
    # 1. MAPEAMENTO DE CLIENTES
    clientes_map = {c.nome: c for c in db.query(Cliente).all()}
    def get_client(name_part):
        for name, obj in clientes_map.items():
            if name_part.lower() in name.lower():
                return obj
        return None

    # 2. DEFINIÇÃO DA CARTEIRA REAL DA AM CONSULTORIA
    carteira_real = [
        {
            "client_name": "Lar São Francisco",
            "main": "Reorganização Operacional Assistencial",
            "extras": [
                "Revisão do Fluxo de Medicação",
                "Organização Documental para VISA"
            ],
            "narrative": "Foco em regularização urgente para auditoria da VISA prevista para o próximo mês. Ambiente de alta pressão por prazos regulatórios.",
            "crises": ["Ruptura operacional: Equipe não aderiu ao novo fluxo de medicação", "Incidente: Medicamento vencido encontrado em estoque ativo"]
        },
        {
            "client_name": "CAPS II Renascer",
            "main": "Estruturação do Fluxo Operacional do CAPS",
            "extras": [
                "Revisão do Fluxo RAAS",
                "Organização dos Usuários Intensivos"
            ],
            "narrative": "Caos imprevisível com excesso de informalidade. Correria no fechamento mensal e reuniões longas para alinhar fluxos.",
            "crises": ["Tensão institucional: Direção relutante em validar protocolos RAAS", "Gargalo documental: Prontuários sem assinatura técnica acumulados"]
        },
        {
            "client_name": "CuidaBem",
            "main": "Estruturação da Operação de Escalas",
            "extras": [
                "Reestruturação do Banco de Cuidadores",
                "Padronização de Acionamentos Emergenciais",
                "Revisão da Comunicação com Famílias"
            ],
            "narrative": "Cliente extremamente acelerado. Acionamentos via WhatsApp e mudanças emocionais constantes. Necessidade de ritmo industrial nas escalas.",
            "crises": ["Instabilidade: Alta rotatividade de cuidadores prejudicando plantões fixos", "Conflito: Mudança abrupta de escala gerou reclamação de 3 famílias"]
        },
        {
            "client_name": "REABILITA",
            "main": "Organização do Fluxo de Atendimento e Faturamento",
            "extras": [
                "Controle de Metas Terapêuticas",
                "Revisão de Autorizações de Convênio",
                "Padronização de Evolução Clínica"
            ],
            "narrative": "Gargalos administrativos e retrabalho financeiro. Pressão constante dos convênios por documentação de evolução clínica.",
            "crises": ["Gargalo financeiro: Faturamento de convênio X retido por glosa técnica", "Retrabalho: Evolução clínica inconsistente em 40% das sessões"]
        },
        {
            "client_name": "Creche Sonho de Criança",
            "main": "Organização Administrativa do Convênio Municipal",
            "extras": [
                "Revisão do Controle de Frequência",
                "Organização Documental das Crianças",
                "Estruturação do Registro de Cardápio"
            ],
            "narrative": "Rotina afetiva mas com baixa organização formal. Medo constante de auditoria municipal por documentação incompleta.",
            "crises": ["Alerta: Documentação de convênio municipal com lacunas de 2 meses", "Risco: Falta de registro oficial de cardápio servido na semana passada"]
        },
        {
            "client_name": "APAE de Bacabal",
            "main": "Integração dos Atendimentos Multiprofissionais",
            "extras": [
                "Revisão dos PIAs",
                "Organização das Transições para Vida Adulta",
                "Estruturação dos Registros de Oficinas"
            ],
            "narrative": "Complexidade intelectual alta e backlog pesado. Conhecimento informal acumulado que precisa ser transposto para PIAs estruturados.",
            "crises": ["Backlog crítico: 120 PIAs pendentes de revisão técnica", "Tensão: Equipe multiprofissional com divergência de conduta clínica"]
        },
        {
            "client_name": "FarmaVida",
            "main": "Organização da Dispensação e Controle Operacional",
            "extras": [
                "Revisão do Fluxo Farmácia Popular",
                "Controle de Lotes e Vencimentos",
                "Padronização de Substituição Genérico/Referência"
            ],
            "narrative": "Resistência ao sistema e dependência da memória do dono. Perdas financeiras por falta de rastreabilidade de lotes.",
            "crises": ["Prejuízo: Perda de R$ 1.500 por produtos vencidos sem alerta do sistema", "Resistência: Balconistas burlando o fluxo de entrada de NF"]
        }
    ]

    # 3. LIMPEZA DE PROJETOS PLACEHOLDER
    # Para cada contrato real, mantemos apenas o conjunto aprovado
    todos_projetos = db.query(Projeto).all()
    for p in todos_projetos:
        cliente = p.contrato.cliente
        # Encontrar configuração para este cliente
        config = next((sc for sc in carteira_real if sc["client_name"].lower() in cliente.nome.lower()), None)
        
        if not config:
            # Cliente não está na carteira real? Manter por segurança ou marcar para remoção?
            # Se for um cliente de teste (ID baixo ou nome genérico), removemos.
            if cliente.id_cliente < 200: # Presumindo que IDs reais são > 290
                 print(f"  [REMOÇÃO] Projeto '{p.titulo}' de Cliente Genérico #{cliente.id_cliente} removido.")
                 db.delete(p)
            continue
            
        allowed_titles = [config["main"]] + config["extras"]
        if p.titulo not in allowed_titles:
            # Projeto Placeholder/Antigo detectado
            print(f"  [CONSOLIDAÇÃO] Removendo Placeholder '{p.titulo}' do cliente {config['client_name']}")
            # Limpar dependências para evitar erro de FK (Embora cascade devesse resolver)
            db.query(Entrega).filter_by(id_projeto=p.id_projeto).delete()
            db.query(ProjetoParcela).filter_by(id_projeto=p.id_projeto).delete()
            db.query(ProjetoExtra).filter_by(id_projeto=p.id_projeto).delete()
            db.delete(p)
    
    db.flush()

    # 4. GARANTIR E ENRIQUECER CARTEIRA REAL
    for sc in carteira_real:
        cliente = get_client(sc["client_name"])
        if not cliente: continue
        contrato = cliente.contratos[0] if cliente.contratos else None
        if not contrato: continue

        print(f"\n  Finalizing {sc['client_name']} Operational Map...")
        
        # Garantir Main
        main_p = db.query(Projeto).filter_by(id_contrato=contrato.id_contrato, titulo=sc["main"]).first()
        if not main_p:
            main_p = Projeto(
                id_contrato=contrato.id_contrato,
                titulo=sc["main"],
                descricao=sc["narrative"],
                data_inicio=contrato.data_inicio,
                valor_total=25000,
                status="em andamento"
            )
            db.add(main_p)
            db.flush()
        
        main_p.descricao = sc["narrative"]

        # Garantir Extras
        for extra_title in sc["extras"]:
            extra_p = db.query(Projeto).filter_by(id_contrato=contrato.id_contrato, titulo=extra_title).first()
            if not extra_p:
                extra_p = Projeto(
                    id_contrato=contrato.id_contrato,
                    titulo=extra_title,
                    descricao=f"Projeto extra focado em {extra_title.lower()}.",
                    data_inicio=BASE_DATE - timedelta(days=60),
                    valor_total=8500,
                    status="em andamento"
                )
                db.add(extra_p)
                db.flush()
            
            if not db.query(ProjetoExtra).filter_by(id_projeto=extra_p.id_projeto).first():
                contatos_cliente = db.query(Contato).filter_by(id_cliente=cliente.id_cliente).all()
                solicitante = contatos_cliente[0].id_contato if contatos_cliente else 1
                db.add(ProjetoExtra(id_projeto=extra_p.id_projeto, solicitado_por=solicitante))

        # 5. DENSIFICAR ENTREGAS (SÓ SE ESTIVER VAZIO)
        all_projs = db.query(Projeto).filter_by(id_contrato=contrato.id_contrato).all()
        for p in all_projs:
            if db.query(Entrega).filter_by(id_projeto=p.id_projeto).count() < 3:
                print(f"    [ENTREGAS] Densificando backlog para '{p.titulo}'...")
                for i in range(random.randint(5, 8)):
                    days_offset = (i - 3) * 15
                    prevista = BASE_DATE + timedelta(days=days_offset)
                    entregue = prevista < BASE_DATE and random.random() > 0.4
                    real = prevista if entregue else None
                    
                    db.add(Entrega(
                        id_projeto=p.id_projeto,
                        descricao=f"Marco {i+1}: {p.titulo} - Fase {i+1}",
                        data_entrega_prevista=prevista,
                        data_entrega_real=real,
                        entregue=entregue
                    ))

        # 6. CRISES E FINANCEIRO
        for crisis in sc["crises"]:
            if not db.query(EventoCritico).filter(EventoCritico.id_contrato == contrato.id_contrato, EventoCritico.descricao.like(f"%{crisis[:20]}%")).first():
                db.add(EventoCritico(
                    id_contrato=contrato.id_contrato,
                    data_evento=BASE_DATE - timedelta(days=random.randint(1, 15)),
                    descricao=crisis,
                    acao_tomada="Intervenção técnica imediata realizada pelo Adriano."
                ))

        # Garantir Parcelas
        for p in all_projs:
            if db.query(ProjetoParcela).filter_by(id_projeto=p.id_projeto).count() == 0:
                val = p.valor_total / 4
                for i in range(4):
                    prevista = p.data_inicio + timedelta(days=30 * (i+1))
                    db.add(ProjetoParcela(
                        id_projeto=p.id_projeto,
                        numero_parcela=i+1,
                        valor_parcela=val,
                        data_pagamento_prevista=prevista,
                        pago=prevista < BASE_DATE - timedelta(days=5)
                    ))

    db.commit()
    print("\n[CONSOLIDAÇÃO] >>> CARTEIRA REAL CONSOLIDADA COM SUCESSO! <<<\n")

def hydrate_entities(db: Session): 
    consolidate_real_projects(db)
    return {}

def simulate_history(db: Session, client_data=None): 
    pass

if __name__ == "__main__":
    from src.database import SessionLocal
    db = SessionLocal()
    try:
        consolidate_real_projects(db)
    finally:
        db.close()
