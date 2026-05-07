import sys
import os
from datetime import datetime, date, timedelta

# Adiciona o diretório 'backend' ao path para encontrar o módulo src
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ""))

from src.database import SessionLocal, engine, Base
from src.models import (
    Cliente, Contato, Contrato, Projeto, 
    Visita, Pendencia, FaturamentoCliente, EventoCritico
)

def seed():
    db = SessionLocal()
    hoje = datetime.now()
    
    try:
        print("[SEED] Iniciando o seed operacional AVANÇADO...")
        
        # Limpar tabelas
        db.query(EventoCritico).delete()
        db.query(Pendencia).delete()
        db.query(FaturamentoCliente).delete()
        db.query(Visita).delete()
        db.query(Projeto).delete()
        db.query(Contrato).delete()
        db.query(Contato).delete()
        db.query(Cliente).delete()
        db.commit()

        # 1. Clientes
        c1 = Cliente(id_cliente=1, nome="CuidaBem Home Care", tipo_instituicao="Home Care", cidade="Sao Luis", status="ativo", nivel_complexidade="alta")
        c2 = Cliente(id_cliente=2, nome="APAE Bacabal", tipo_instituicao="Filantropica", cidade="Bacabal", status="ativo", nivel_complexidade="media")
        c3 = Cliente(id_cliente=3, nome="CAPS II Renascer", tipo_instituicao="Publica", cidade="Sao Luis", status="ativo", nivel_complexidade="alta")
        c4 = Cliente(id_cliente=4, nome="Lar Sao Francisco", tipo_instituicao="ILPI", cidade="Sao Luis", status="ativo", nivel_complexidade="media")
        
        db.add_all([c1, c2, c3, c4])
        db.commit()

        # 2. Contratos
        ct1 = Contrato(id_contrato=1, id_cliente=1, servicos_contratados="Gestao Operacional", visitas_previstas_mes=4, valor_mensal=4500.00, status="ativo", data_inicio=date(2025, 1, 1))
        ct2 = Contrato(id_contrato=2, id_cliente=2, servicos_contratados="Adequacao Processos", visitas_previstas_mes=2, valor_mensal=3800.00, status="ativo", data_inicio=date(2025, 6, 1))
        ct3 = Contrato(id_contrato=3, id_cliente=3, servicos_contratados="Vigilancia Sanitaria", visitas_previstas_mes=4, valor_mensal=3200.00, status="ativo", data_inicio=date(2025, 3, 1))
        ct4 = Contrato(id_contrato=4, id_cliente=4, servicos_contratados="Suporte Tecnico", visitas_previstas_mes=2, valor_mensal=2500.00, status="ativo", data_inicio=date(2024, 10, 1))
        
        db.add_all([ct1, ct2, ct3, ct4])
        db.commit()

        # 3. Visitas Avançadas (O Caos Real)
        
        # CuidaBem: Excesso de acionamentos e Fora de Horário
        v1 = Visita(id_visita=1, id_cliente=1, id_contrato=1, status="realizada", data_hora=hoje - timedelta(days=1, hours=20), duracao_estimada_minutos=30, modalidade="presencial", descricao="Emergencia Noturna - Escala Cuidadores", resultados="Resolvido via remanejamento.")
        v2 = Visita(id_visita=2, id_cliente=1, id_contrato=1, status="realizada", data_hora=hoje - timedelta(days=3), duracao_estimada_minutos=45, modalidade="remota", descricao="Ajuste rapido fluxo medicacao", resultados="Orientacao enviada.")
        v3 = Visita(id_visita=3, id_cliente=1, id_contrato=1, status="realizada", data_hora=hoje - timedelta(days=4, hours=2), duracao_estimada_minutos=40, modalidade="presencial", descricao="Suporte operacao - Sabado", resultados="Visita extra nao prevista.")
        v4 = Visita(id_visita=4, id_cliente=1, id_contrato=1, status="agendada", data_hora=hoje + timedelta(hours=5), duracao_estimada_minutos=60, modalidade="presencial", descricao="Visita de Rotina Semana 2", resultados=None)
        
        # APAE: Imersão e Deslocamento
        v5 = Visita(id_visita=5, id_cliente=2, id_contrato=2, status="realizada", data_hora=hoje - timedelta(days=10), duracao_estimada_minutos=540, modalidade="presencial", descricao="Imersao Bacabal - Auditoria Interna", resultados="Mapeamento completo realizado.")
        
        # CAPS: Burocracia e Pressão
        v6 = Visita(id_visita=6, id_cliente=3, id_contrato=3, status="realizada", data_hora=hoje - timedelta(days=2), duracao_estimada_minutos=150, modalidade="presencial", descricao="Reuniao Gestao - Alinhamento ANVISA", resultados="Necessita correcao imediata de prontuarios.")
        
        # Lar Sao Francisco: Goodwill Puro
        v7 = Visita(id_visita=7, id_cliente=4, id_contrato=4, status="realizada", data_hora=hoje - timedelta(days=5), duracao_estimada_minutos=120, modalidade="presencial", descricao="Apoio Familiar - Caso Delicado", resultados="Mediacao de conflito entre lar e familia.")
        v8 = Visita(id_visita=8, id_cliente=4, id_contrato=4, status="realizada", data_hora=hoje - timedelta(days=12), duracao_estimada_minutos=90, modalidade="presencial", descricao="Visita Extra - Suporte Administrativo", resultados="Ajuste de fluxos internos.")
        
        db.add_all([v1, v2, v3, v4, v5, v6, v7, v8])
        db.commit()

        # 4. Pendencias Críticas
        p1 = Pendencia(id_pendencia=1, id_contrato=1, id_visita=1, descricao="Enviar Manual de Escala Atualizado", responsavel="Equipe", data_origem=hoje - timedelta(days=2), data_prazo=hoje - timedelta(hours=2), resolvida=False)
        p2 = Pendencia(id_pendencia=2, id_contrato=3, id_visita=6, descricao="Regularizar Alvará Sanitário", responsavel="Adriano", data_origem=hoje - timedelta(days=5), data_prazo=hoje + timedelta(days=2), resolvida=False)
        p3 = Pendencia(id_pendencia=3, id_contrato=4, id_visita=7, descricao="Relatorio Social para o MP", responsavel="Adriano", data_origem=hoje - timedelta(days=6), data_prazo=hoje + timedelta(days=1), resolvida=False)
        
        db.add_all([p1, p2, p3])
        db.commit()

        # 5. Financeiro Estratégico
        f1 = FaturamentoCliente(id_faturamento=1, id_contrato=4, valor_total=2500.00, data_emissao=date(hoje.year, hoje.month-1, 10), status="atrasado")
        f2 = FaturamentoCliente(id_faturamento=2, id_contrato=1, valor_total=4500.00, data_emissao=date(hoje.year, hoje.month-1, 10), status="pago")
        
        db.add_all([f1, f2])
        db.commit()

        print("[SEED] Seed AVANÇADO finalizado!")

    except Exception as e:
        print(f"[SEED][ERROR] {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
