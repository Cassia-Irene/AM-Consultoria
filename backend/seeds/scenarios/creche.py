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
            tipo_instituicao="Escola",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="baixa"
        )

        # 1. Contatos
        self.add_contato(cliente, "Tia Jô", "Diretora Pedagógica", "Institucional")
        self.add_contato(cliente, "Marcão", "Zelador Chefe", "Operacional")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Conformidade e Processos",
                visitas_previstas_mes=2,
                data_inicio=date(2025, 4, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 1500.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)

        # 1. Projeto: Portal dos Pais
        projeto = self.add_projeto(contrato, "Portal de Comunicação", valor_total=1000.00)
        self._add_and_commit([
            Entrega(id_projeto=projeto.id_projeto, descricao="Design de Interface", data_entrega_prevista=mes_passado, entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Lançamento Beta", data_entrega_prevista=hoje_date, entregue=False)
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=1000.00, data_pagamento_prevista=mes_passado, pago=True, data_pagamento=mes_passado)
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
        pendencias.append(create_causal_pendency(v_inspecao, "Atualizar POPs da cantina", responsavel="Adriano", dias_prazo=10))

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
