from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

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
        
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = date.today()
        mes_passado = subtrair_meses(hoje_date, 1)

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
            resultados="Detectada falta de extintores em 2 alas. Adequação da cantina iniciada."
        )
        self._add_and_commit([v_inspecao])

        # Causalidade: Inspeção gerou pendências de adequação
        pendencias.append(create_causal_pendency(v_inspecao, "Atualizar POPs da manipulação de alimentos na cantina", responsavel="Adriano", dias_prazo=10))

        if mode in ["realistic", "stress"]:
            v_reuniao = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-5),
                duracao_minutos=90,
                tipo_visita="urgente",
                modalidade="remota",
                descricao="Acompanhamento do Plano de Ação",
                resultados="Extintores comprados. Orçamento da cantina aprovado."
            )
            self._add_and_commit([v_reuniao])
            pendencias.append(create_causal_pendency(v_reuniao, "Solicitar vistoria final do Corpo de Bombeiros", responsavel="Equipe Cliente", dias_prazo=7))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=1500.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=1500.00,
                pago=True,
                data_pagamento=date(mes_passado.year, mes_passado.month, 10)
            )
        ]
        self._add_and_commit(faturamentos)
