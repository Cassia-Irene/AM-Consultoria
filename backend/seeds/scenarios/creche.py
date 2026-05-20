from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import (
    subtrair_meses, data_relativa_datetime, get_hoje_date, 
    create_causal_pendency, create_causal_event
)
from src.models import (
    Cliente, Contrato, Visita, FaturamentoCliente, Entrega, 
    ProjetoParcela, VisitaExtra
)

class CrecheScenario(Scenario):
    """
    Cenário: Creche Sonho de Criança
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="Creche Sonho de Criança",
            tipo_instituicao="Creche Comunitária Conveniada",
            cidade="São Luís/MA",
            status="ativo",
            nivel_complexidade="média",
            observacoes_gerais="Equipe afetiva e pouco organizada documentalmente. Grande medo de auditoria da prefeitura."
        )

        # 1. Contatos
        self.add_contato(cliente, "Rosângela Teixeira", "Diretora", "Decisor")
        self.add_contato(cliente, "Ana Paula Ferreira", "Secretaria", "Operacional")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Organização administrativa e prestação de contas",
                visitas_previstas_mes=3,
                inclui_relatorio=True,
                data_inicio=date(2024, 6, 1),
                observacoes_gerais="Equipe afetiva e pouco organizada documentalmente. Grande medo de auditoria da prefeitura. [OVERRIDE_PERFIL:normal] [OVERRIDE_SAUDE:normal] [OVERRIDE_DESGASTE:0]"
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 4500.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)

        # 1. Projeto: Frequência Escolar
        p_freq = self.add_projeto(contrato, "Revisão de frequência escolar", valor_total=1000.00)
        self._add_and_commit([
            Entrega(id_projeto=p_freq.id_projeto, descricao="Mapeamento de faltas", data_entrega_prevista=mes_passado, entregue=True),
        ])
        
        # 2. Projeto: Documentação Convênio
        p_conv = self.add_projeto(contrato, "Organização documental de convênio", valor_total=2000.00)
        self._add_and_commit([
            Entrega(id_projeto=p_conv.id_projeto, descricao="Dossiê para prefeitura", data_entrega_prevista=hoje_date, entregue=False),
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=p_conv.id_projeto, numero_parcela=1, valor_parcela=1000.00, data_pagamento_prevista=mes_passado, pago=True, data_pagamento=mes_passado)
        ])

        visitas = []
        pendencias = []
        eventos = []
        
        v_inspecao = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-20),
            duracao_minutos=180,
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Inspeção Predial - Foco Corpo de Bombeiros",
            resultados="Detectada falta de extintores em 2 alas."
        )
        self._add_and_commit([v_inspecao])
        pendencias.append(create_causal_pendency(v_inspecao, "Atualizar POPs da cantina", responsavel="AM Consultoria", dias_prazo=10))

        if mode in ["realistic", "stress"]:
            # Visita Extra: Treinamento de Emergência Pediátrica
            v_treino = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-5),
                duracao_minutos=120,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="TREINAMENTO: Primeiros Socorros Pediátricos (Lei Lucas)",
                resultados="Equipe 100% treinada e certificada."
            )
            self._add_and_commit([v_treino])
            
            contato_jo = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            self.db.add(VisitaExtra(id_visita=v_treino.id_visita, solicitado_por=contato_jo.id_contato))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=1500.00, valor_extra=0.00, desconto=0.00, valor_total=1500.00,
                pago=True, data_pagamento=date(mes_passado.year, mes_passado.month, 10)
            )
        ]
        self._add_and_commit(faturamentos)
