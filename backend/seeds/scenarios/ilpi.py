from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import get_hoje, subtrair_meses, data_relativa_dias, data_relativa_horas
from src.models import Cliente, Contrato, Visita, Pendencia, FaturamentoCliente, EventoCritico

class ILPIScenario(Scenario):
    """
    Cenário: Lar São Francisco (ILPI)
    Realidade Operacional: Complexidade média em processos, mas alta carga de "Goodwill" (trabalho invisível).
    Muitos incidentes com idosos, controle de medicação, médiação com famílias.
    """

    def generate_structure(self):
        cliente = Cliente(
            nome="Lar São Francisco",
            tipo_instituicao="ILPI",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="média"
        )
        self.db.add(cliente)
        self.db.flush()

        contrato = Contrato(
            id_cliente=cliente.id_cliente,
            servicos_contratados="Suporte Técnico e Gestão de Incidentes",
            visitas_previstas_mes=2,
            valor_mensal=2500.00,
            status="ativo",
            data_inicio=date(2024, 10, 1)
        )
        self.db.add(contrato)
        self.db.flush()
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        from seeds.utils import create_causal_pendency, create_causal_event, apply_stress_limits
        hoje_date = get_hoje().date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)
        tres_meses_atras = subtrair_meses(hoje_date, 3)

        visitas = []
        pendencias = []
        eventos = []
        
        v_incidente = Visita(
            id_cliente=cliente.id_cliente,
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_dias(-8),
            duracao_estimada_minutos=180,
            modalidade="presencial",
            descricao="Mediação de conflito familiar pós-incidente (Queda)",
            resultados="Família acalmada. Protocolo de prevenção de quedas revisado."
        )
        visitas.append(v_incidente)
        
        # Causalidade: Incidente gera pendências de adequação estrutural
        pendencias.append(create_causal_pendency(v_incidente, "Treinar cuidadores no novo protocolo de prevenção de quedas", responsavel="Adriano", dias_prazo=10))
        pendencias.append(create_causal_pendency(v_incidente, "Cotar fornecedor para tapetes antiderrapantes", responsavel="Equipe Cliente", atrasada=True))

        if mode in ["realistic", "stress"]:
            v_goodwill = Visita(
                id_cliente=cliente.id_cliente,
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_dias(-1),
                duracao_estimada_minutos=90,
                modalidade="remota",
                descricao="Apoio emocional à coordenação (Overload)",
                resultados="Conversa de alinhamento e suporte (não faturável)."
            )
            visitas.append(v_goodwill)

        if mode in ["realistic", "stress"]:
            eventos.append(create_causal_event(v_incidente, "Incidente Operacional", "Queda de idoso no banho devido a falta de piso emborrachado.", impacto="Crítico Operacional", resolvido=True))

        if mode == "stress":
            eventos.append(create_causal_event(v_incidente, "Risco de Processo Judicial", "Família do idoso ameaçou acionar a ILPI.", impacto="Crítico Real", resolvido=False))
            eventos = apply_stress_limits(eventos)

        self._add_and_commit(visitas)
        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(tres_meses_atras.year, tres_meses_atras.month, 1),
                valor_base=2500.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=2500.00,
                pago=True,
                data_pagamento=date(tres_meses_atras.year, tres_meses_atras.month, 10)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=2500.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=2500.00,
                pago=True,
                data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 10)
            )
        ]

        # No Stress mode dá um desconto brutal de goodwill
        desconto_mes = 1000.00 if mode == "stress" else (500.00 if mode == "realistic" else 0.00)

        faturamentos.append(
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=2500.00,
                valor_extra=0.00,
                desconto=desconto_mes, # Concedeu desconto por dificuldades da ILPI
                valor_total=2500.00 - desconto_mes,
                pago=True,
                data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            )
        )
        self._add_and_commit(faturamentos)
