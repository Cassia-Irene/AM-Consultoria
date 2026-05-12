import sys
import os
import random
from datetime import datetime, timedelta, date
from sqlalchemy import text
from sqlalchemy.orm import Session

# Adiciona o caminho do backend ao sys.path
sys.path.append(os.getcwd())

from src.database import SessionLocal
from src.models import (
    Cliente, Contato, Contrato, Visita, Pendencia, 
    FaturamentoCliente, EventoCritico, Projeto, ProjetoParcela
)

# Configuração Determinística
random.seed(42)

CLIENT_IDS = [43, 44, 45, 46, 47, 48, 49]

def cleanup_operational_data(db: Session):
    """Limpa dados operacionais vinculados aos 7 clientes para garantir idempotência."""
    print("[IDEMPOTÊNCIA] Limpando histórico operacional dos clientes 43-49...")
    
    # Busca todos os IDs de contrato destes clientes
    contrato_ids = [r[0] for r in db.execute(text("SELECT id_contrato FROM contratos WHERE id_cliente IN :ids"), {"ids": tuple(CLIENT_IDS)}).fetchall()]
    
    if not contrato_ids:
        print("[AVISO] Nenhum contrato encontrado para limpeza prévia.")
    else:
        # Ordem reversa de dependência (Folhas primeiro)
        db.execute(text("DELETE FROM entregas WHERE id_projeto IN (SELECT id_projeto FROM projetos WHERE id_contrato IN :ids)"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM projeto_parcelas WHERE id_projeto IN (SELECT id_projeto FROM projetos WHERE id_contrato IN :ids)"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM projetos WHERE id_contrato IN :ids"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM eventos_criticos WHERE id_contrato IN :ids"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM pendencias WHERE id_contrato IN :ids"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM visitas_extra WHERE id_visita IN (SELECT id_visita FROM visitas WHERE id_contrato IN :ids)"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM visitas WHERE id_contrato IN :ids"), {"ids": tuple(contrato_ids)})
        db.execute(text("DELETE FROM faturamento_cliente WHERE id_contrato IN :ids"), {"ids": tuple(contrato_ids)})

    # Tabelas ligadas diretamente ao id_cliente
    db.execute(text("DELETE FROM contatos WHERE id_cliente IN :ids"), {"ids": tuple(CLIENT_IDS)})
    db.commit()

def hydrate_entities(db: Session):
    """Atualiza as entidades base (Clientes, Contatos, Contratos)."""
    print("[ENTIDADES] Atualizando Clientes e Contratos...")
    
    data = {
        43: {
            "nome": "Lar São Francisco de Cuidados para Idosos",
            "tipo": "ILPI Privada",
            "complexidade": "alta",
            "cidade": "São Luís/MA",
            "observacoes": "A Conceição é extremamente comprometida com cuidado, mas evita conflitos administrativos. A equipe assistencial é emocionalmente sobrecarregada. Quando há incidente com residente, tudo vira prioridade máxima.",
            "contrato": {
                "visitas": 6, 
                "valor": 8500.0, 
                "relatorio": True, 
                "servicos": "Diagnóstico organizacional, revisão de processos assistenciais, acompanhamento mensal",
                "inicio": date(2025, 2, 1)
            },
            "contatos": [
                {"nome": "Conceição Ribeiro", "papel": "Operacional", "cargo": "Diretora / Operacional"},
                {"nome": "Patrícia Ribeiro", "papel": "Decisor", "cargo": "Administrativo Financeiro / Decisora parcial"},
                {"nome": "Dr. Álvaro Mendes", "papel": "Técnico", "cargo": "Médico parceiro recorrente"}
            ]
        },
        45: {
            "nome": "CAPS II Renascer",
            "tipo": "Saúde Mental Pública",
            "complexidade": "alta",
            "cidade": "São Luís/MA",
            "observacoes": "Ambiente muito sensível emocionalmente. A equipe trabalha sobrecarregada. Demandas urgentes surgem sem previsibilidade. Muitas decisões acontecem informalmente.",
            "contrato": {
                "visitas": 4, 
                "valor": 6200.0, 
                "relatorio": True, 
                "servicos": "Apoio organizacional e fluxo operacional",
                "inicio": date(2024, 8, 1)
            },
            "contatos": [
                {"nome": "Dr. Augusto Leal", "papel": "Decisor", "cargo": "Coordenador"},
                {"nome": "Márcia Costa", "papel": "Operacional", "cargo": "Assistente Social"},
                {"nome": "Joana Nunes", "papel": "Operacional", "cargo": "Administrativo da Secretaria"}
            ]
        },
        46: {
            "nome": "CuidaBem Serviços Domiciliares",
            "tipo": "Home Care",
            "complexidade": "alta",
            "cidade": "São Luís/MA",
            "observacoes": "Cliente extremamente acelerado. Tudo acontece via WhatsApp. Marcela toma decisão emocional sob pressão. Mudanças de escala acontecem o tempo todo.",
            "contrato": {
                "visitas": 8, 
                "valor": 12000.0, 
                "relatorio": False, 
                "servicos": "Estruturação operacional e escala",
                "inicio": date(2025, 1, 1),
                "tipo_pagamento": "Mensal + Projetos paralelos"
            },
            "contatos": [
                {"nome": "Marcela Viana", "papel": "Decisor", "cargo": "Fundadora"},
                {"nome": "Felipe Braga", "papel": "Operacional", "cargo": "Coordenação Operacional"},
                {"nome": "Amanda Sousa", "papel": "Financeiro", "cargo": "Financeiro"}
            ]
        },
        47: {
            "nome": "REABILITA Centro de Reabilitação",
            "tipo": "Clínica de Reabilitação",
            "complexidade": "média/alta",
            "cidade": "São Luís/MA",
            "observacoes": "Equipe técnica muito boa, mas gestão financeira confusa. A Fernanda muda prioridades frequentemente conforme pressão dos convênios.",
            "contrato": {
                "visitas": 4, 
                "valor": 7000.0, 
                "relatorio": True, 
                "servicos": "Organização operacional e faturamento",
                "inicio": date(2025, 3, 1)
            },
            "contatos": [
                {"nome": "Dra. Fernanda Caldas", "papel": "Decisor", "cargo": "Sócia-proprietária"},
                {"nome": "Cláudia Mendes", "papel": "Operacional", "cargo": "Recepção administrativa"}
            ]
        },
        44: {
            "nome": "Creche Sonho de Criança",
            "tipo": "Creche Comunitária Conveniada",
            "complexidade": "média",
            "cidade": "São Luís/MA",
            "observacoes": "Equipe afetiva e pouco organizada documentalmente. Grande medo de auditoria da prefeitura.",
            "contrato": {
                "visitas": 3, 
                "valor": 4500.0, 
                "relatorio": True,
                "servicos": "Organização administrativa e prestação de contas",
                "inicio": date(2024, 6, 1)
            },
            "contatos": [
                {"nome": "Rosângela Teixeira", "papel": "Decisor", "cargo": "Diretora"},
                {"nome": "Ana Paula Ferreira", "papel": "Operacional", "cargo": "Secretaria"}
            ]
        },
        48: {
            "nome": "APAE de Bacabal",
            "tipo": "Educação Especial",
            "complexidade": "alta",
            "cidade": "Bacabal/MA",
            "observacoes": "Instituição muito dependente do conhecimento informal da Neuza. Equipe pequena para demanda enorme. Sempre existe sensação de urgência acumulada.",
            "contrato": {
                "visitas": 2, 
                "valor": 9000.0, 
                "relatorio": True,
                "servicos": "Estruturação multiprofissional",
                "inicio": date(2024, 4, 1),
                "tipo_pagamento": "Mensal + Projeto"
            },
            "contatos": [
                {"nome": "Neuza Farias", "papel": "Decisor", "cargo": "Diretora pedagógica"},
                {"nome": "Carlos Henrique", "papel": "Operacional", "cargo": "Administrativo"},
                {"nome": "Juliana Lopes", "papel": "Técnico", "cargo": "Psicologia"}
            ]
        },
        49: {
            "nome": "FarmaVida Farmácia Comunitária",
            "tipo": "Farmácia Popular",
            "complexidade": "média",
            "cidade": "Caxias/MA",
            "observacoes": "Operação muito baseada na memória do dono. Resistência inicial ao uso de sistema. Grande preocupação com perda financeira por erro operacional.",
            "contrato": {
                "visitas": 2, 
                "valor": 3800.0, 
                "relatorio": False,
                "servicos": "Organização operacional e rastreabilidade",
                "inicio": date(2024, 9, 1),
                "tipo_pagamento": "Por visita"
            },
            "contatos": [
                {"nome": "Raimundo Alves", "papel": "Decisor", "cargo": "Proprietário"},
                {"nome": "Luciana Alves", "papel": "Financeiro", "cargo": "Financeiro"},
                {"nome": "Rafael Sousa", "papel": "Técnico", "cargo": "Farmacêutico Responsável"}
            ]
        }
    }

    for cid, info in data.items():
        cliente = db.get(Cliente, cid)
        if cliente:
            cliente.nome = info["nome"]
            cliente.tipo_instituicao = info["tipo"]
            cliente.nivel_complexidade = info["complexidade"]
            cliente.cidade = info["cidade"]
            cliente.status = "ativo"
            cliente.observacoes_gerais = info.get("observacoes")
            
            # Contrato
            contrato = db.query(Contrato).filter_by(id_cliente=cid).first()
            if contrato:
                contrato.visitas_previstas_mes = info["contrato"]["visitas"]
                contrato.inclui_relatorio = info["contrato"]["relatorio"]
                
                # Data de início customizada ou padrão (180 dias atrás)
                if "inicio" in info["contrato"]:
                    contrato.data_inicio = info["contrato"]["inicio"]
                else:
                    contrato.data_inicio = datetime.now().date() - timedelta(days=180)
                
                contrato.servicos_contratados = info["contrato"].get("servicos", f"Acompanhamento tático de {info['tipo']}")
                
                # --- NOVO: Registro de Pagamento ---
                from src.models import TipoPagamento, ContratoPagamento
                tipo_nome = info["contrato"].get("tipo_pagamento", "Mensal")
                tp = db.query(TipoPagamento).filter(TipoPagamento.tipo.ilike(tipo_nome)).first()
                if not tp:
                    tp = TipoPagamento(tipo=tipo_nome)
                    db.add(tp)
                    db.flush()
                
                # Limpa pagamentos anteriores para idempotência
                db.execute(text("DELETE FROM contrato_pagamento WHERE id_contrato = :id"), {"id": contrato.id_contrato})
                db.add(ContratoPagamento(
                    id_contrato=contrato.id_contrato,
                    id_tipo_pagamento=tp.id_tipo,
                    valor=info["contrato"]["valor"]
                ))
            
            # Contatos
            for c in info["contatos"]:
                # Gerar email seguro (sem acentos ou caracteres especiais)
                import unicodedata
                normalized = unicodedata.normalize('NFD', c["nome"].lower())
                safe_name = "".join(x for x in normalized if unicodedata.category(x) != 'Mn')
                safe_name = safe_name.replace(' ', '.')
                safe_name = "".join(x for x in safe_name if x.isalnum() or x == '.')
                while '..' in safe_name: safe_name = safe_name.replace('..', '.')
                safe_name = safe_name.strip('.')
                
                db.add(Contato(
                    id_cliente=cid,
                    nome=c["nome"],
                    papel=c["papel"],
                    cargo=c["cargo"],
                    email=f"{safe_name}@cliente.com"
                ))
    db.commit()
    return data

def subtract_months(sourcedate, months):
    month = sourcedate.month - 1 - months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    return datetime(year, month, 1)

def simulate_history(db: Session, client_data: dict):
    """Gera 6 meses de histórico determinístico e caótico."""
    print("[HISTÓRICO] Gerando 6 meses de operação verossímil...")
    
    now = datetime.now()
    
    for month_offset in range(5, -1, -1):
        target_month_start = subtract_months(now, month_offset)
        
        for cid, info in client_data.items():
            contrato = db.query(Contrato).filter_by(id_cliente=cid).first()
            if not contrato: continue

            # --- VISITAS E CAOS ---
            previstas = info["contrato"]["visitas"]
            
            realizadas_count = previstas
            if cid == 43: # Lar São Francisco - Oscilação
                realizadas_count = previstas - 1 if month_offset % 2 == 0 else previstas + 1
            elif cid == 46: # CuidaBem - Urgência
                realizadas_count = previstas + random.randint(0, 2)
            elif cid == 49: # FarmaVida - Espaçado
                realizadas_count = 1 if month_offset % 2 == 0 else 0
            
            for i in range(realizadas_count):
                day = random.randint(1, 28)
                v_date = target_month_start + timedelta(days=day)
                if v_date > now: continue

                visita = Visita(
                    id_contrato=contrato.id_contrato,
                    data_hora=v_date.replace(hour=14, minute=0),
                    status="realizada",
                    tipo_visita="rotineira" if random.random() > 0.2 else "urgente",
                    modalidade="presencial",
                    duracao_minutos=60, # Garantir valor não nulo
                    descricao=f"Acompanhamento operacional mensal - Ciclo M-{month_offset}",
                    resultados="Revisão de processos concluída."
                )
                db.add(visita)
                db.flush()

                # Pendências
                if random.random() > 0.4:
                    is_resolvida = (now - v_date).days > 20
                    if month_offset == 0 and random.random() > 0.3: is_resolvida = False
                    
                    db.add(Pendencia(
                        id_contrato=contrato.id_contrato,
                        id_visita=visita.id_visita,
                        descricao=f"Ajustar fluxo de {random.choice(['medicamentos', 'escala', 'documentação', 'financeiro'])}",
                        resolvida=is_resolvida,
                        data_origem=v_date.date(),
                        data_prazo=(v_date + timedelta(days=7)).date(),
                        data_resolucao=(v_date + timedelta(days=5)).date() if is_resolvida else None,
                        responsavel="Equipe Cliente" if random.random() > 0.5 else "Adriano"
                    ))

            # --- FATURAMENTO ---
            valor_base = info["contrato"]["valor"]
            pago = True
            if cid == 43 and month_offset in [1, 2]: pago = False 
            if cid == 47 and month_offset == 0: pago = False 

            db.add(FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=target_month_start.date(),
                valor_base=valor_base,
                valor_total=valor_base,
                pago=pago,
                data_pagamento=(target_month_start + timedelta(days=15)).date() if pago else None,
                visitas_realizadas=realizadas_count
            ))

            # --- EVENTOS CRÍTICOS ---
            if cid == 43 and month_offset == 2:
                db.add(EventoCritico(
                    id_contrato=contrato.id_contrato,
                    descricao="Fiscalização da VISA - Alerta estrutural grave",
                    data_evento=(target_month_start + timedelta(days=10)).date(),
                    acao_tomada="Plano de adequação enviado."
                ))
            if cid == 46 and month_offset == 1:
                 db.add(EventoCritico(
                    id_contrato=contrato.id_contrato,
                    descricao="Crise de Escala: Saída súbita de cuidadores",
                    data_evento=(target_month_start + timedelta(days=5)).date(),
                    acao_tomada="Reorganização de plantões."
                ))

    # --- PROJETOS EXTRAS ---
    for cid in [43, 44, 45, 46, 47, 48, 49]: # Todos os clientes ativos
        contrato = db.query(Contrato).filter_by(id_cliente=cid).first()
        if contrato:
            if cid == 43:
                # Projetos do Lar São Francisco
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Revisão do fluxo de medicação", status="em andamento", data_inicio=(now - timedelta(days=30)).date(), valor_total=2500.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Organização documental para VISA", status="em andamento", data_inicio=(now - timedelta(days=15)).date(), valor_total=3000.0))
            elif cid == 44:
                # Projetos da Creche
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Revisão de frequência escolar", status="em andamento", data_inicio=(now - timedelta(days=45)).date(), valor_total=1000.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Organização documental de convênio", status="em andamento", data_inicio=(now - timedelta(days=20)).date(), valor_total=2000.0))
            elif cid == 45:
                # Projetos do CAPS
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Revisão do fluxo RAAS", status="em andamento", data_inicio=(now - timedelta(days=40)).date(), valor_total=1200.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Acompanhamento de usuários intensivos", status="em andamento", data_inicio=(now - timedelta(days=20)).date(), valor_total=1500.0))
            elif cid == 46:
                # Projetos do CuidaBem
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Estruturação de controle de cuidadores", status="em andamento", data_inicio=(now - timedelta(days=45)).date(), valor_total=3000.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Redesenho da escala de plantão", status="em andamento", data_inicio=(now - timedelta(days=25)).date(), valor_total=2000.0))
            elif cid == 47:
                # Projetos do REABILITA
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Revisão de autorização de convênios", status="em andamento", data_inicio=(now - timedelta(days=35)).date(), valor_total=2800.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Controle de sessões e metas", status="em andamento", data_inicio=(now - timedelta(days=15)).date(), valor_total=2200.0))
            elif cid == 48:
                # Projetos da APAE
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Revisão dos PIAs", status="concluído", data_inicio=(now - timedelta(days=60)).date(), valor_total=3500.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Organização integrada de atendimentos", status="em andamento", data_inicio=(now - timedelta(days=30)).date(), valor_total=2500.0))
            elif cid == 49:
                # Projetos da FarmaVida
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Controle de dispensação", status="em andamento", data_inicio=(now - timedelta(days=50)).date(), valor_total=1500.0))
                db.add(Projeto(id_contrato=contrato.id_contrato, titulo="Revisão de fluxo Farmácia Popular", status="em andamento", data_inicio=(now - timedelta(days=25)).date(), valor_total=1800.0))
            else:
                pass

    db.commit()
    print("[SUCESSO] Hidratação Semântica concluída com determinismo e idempotência.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        cleanup_operational_data(db)
        client_data = hydrate_entities(db)
        simulate_history(db, client_data)
    finally:
        db.close()
