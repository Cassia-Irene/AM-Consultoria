from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import get_hoje, subtrair_meses, data_relativa_dias, data_relativa_horas
from src.models import Cliente, Contrato, Visita, Pendencia, FaturamentoCliente, EventoCritico

class CrecheScenario(Scenario):
    """
    Cenário: Creche Sonho de Criança
    Realidade Operacional: Foco em conformidade estrutural (Bombeiros, Vigilância Sanitária),
    treinamento da equipe de monitores e gestão administrativa/pedagógica.
    """

    def generate_structure(self):
        cliente = Cliente(
            nome="Creche Sonho de Criança",
            tipo_instituicao="Escola",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="baixa"
        )
        self.db.add(cliente)
        self.db.flush()

        contrato = Contrato(
            id_cliente=cliente.id_cliente,
            servicos_contratados="Conformidade e Processos",
            visitas_previstas_mes=2,
            valor_mensal=1500.00,
            status="ativo",
            data_inicio=date(2025, 4, 1) # Contrato recente
        )
        self.db.add(contrato)
        self.db.flush()
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        from seeds.utils import create_causal_pendency, create_causal_event, apply_stress_limits
        hoje_date = get_hoje().date()
        mes_passado = subtrair_meses(hoje_date, 1)

        visitas = []
        pendencias = []
        eventos = []
        
        v_inspecao = Visita(
            id_cliente=cliente.id_cliente,
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_dias(-20),
            duracao_estimada_minutos=180,
            modalidade="presencial",
            descricao="Inspeção Predial - Foco Corpo de Bombeiros",
            resultados="Detectada falta de extintores em 2 alas. Adequação da cantina iniciada."
        )
        visitas.append(v_inspecao)

        # Causalidade: Inspeção gerou pendências de adequação
        pendencias.append(create_causal_pendency(v_inspecao, "Atualizar POPs da manipulação de alimentos na cantina", responsavel="Adriano", dias_prazo=10))

        if mode in ["realistic", "stress"]:
            v_reuniao = Visita(
                id_cliente=cliente.id_cliente,
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_dias(-5),
                duracao_estimada_minutos=90,
                modalidade="remota",
                descricao="Acompanhamento do Plano de Ação",
                resultados="Extintores comprados. Orçamento da cantina aprovado."
            )
            visitas.append(v_reuniao)
            pendencias.append(create_causal_pendency(v_reuniao, "Solicitar vistoria final do Corpo de Bombeiros", responsavel="Equipe Cliente", dias_prazo=7))

        if mode == "stress":
            eventos.append(create_causal_event(v_inspecao, "Atraso na Vistoria", "Bombeiros negaram a primeira vistoria por falta de sinalização.", impacto="Ruído Operacional", resolvido=True))
            eventos = apply_stress_limits(eventos)

        self._add_and_commit(visitas)
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
