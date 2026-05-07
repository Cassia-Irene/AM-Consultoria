from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import get_hoje, subtrair_meses, data_relativa_dias, data_relativa_horas
from src.models import Cliente, Contrato, Visita, Pendencia, FaturamentoCliente, EventoCritico

class FarmaciaScenario(Scenario):
    """
    Cenário: FarmaVida
    Realidade Operacional: Contrato focado em conformidade, rastreabilidade de medicamentos
    e manutenção do programa Farmácia Popular (risco de perda de subsídio).
    """

    def generate_structure(self):
        cliente = Cliente(
            nome="FarmaVida",
            tipo_instituicao="Farmácia",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="baixa"
        )
        self.db.add(cliente)
        self.db.flush()

        contrato = Contrato(
            id_cliente=cliente.id_cliente,
            servicos_contratados="Auditoria Regulatória e Farmácia Popular",
            visitas_previstas_mes=2,
            valor_mensal=1800.00,
            status="ativo",
            data_inicio=date(2025, 2, 1)
        )
        self.db.add(contrato)
        self.db.flush()
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        from seeds.utils import create_causal_pendency, create_causal_event, apply_stress_limits
        hoje_date = get_hoje().date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        visitas = []
        pendencias = []
        eventos = []
        
        v_auditoria = Visita(
            id_cliente=cliente.id_cliente,
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_dias(-6),
            duracao_estimada_minutos=120,
            modalidade="presencial",
            descricao="Conferência de Lotes - Farmácia Popular",
            resultados="Encontrada divergência em 3 receitas (falta de assinatura médica)."
        )
        visitas.append(v_auditoria)

        # Causalidade: Auditoria gera pendências regulatórias
        pendencias.append(create_causal_pendency(v_auditoria, "Notificar prescritores para correção das 3 receitas irregulares", responsavel="Equipe Cliente", atrasada=True))
        pendencias.append(create_causal_pendency(v_auditoria, "Atualizar inventário no sistema SNGPC", responsavel="Adriano", dias_prazo=5))

        if mode == "stress":
            eventos.append(create_causal_event(v_auditoria, "Alerta SNGPC", "Falha de transmissão de inventário no sistema do governo.", impacto="Crítico Operacional", resolvido=False))
            eventos = apply_stress_limits(eventos)

        self._add_and_commit(visitas)
        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # 5. Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=1800.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=1800.00,
                pago=True,
                data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 15)
            )
        ]

        pagou_mes_passado = False if mode == "stress" else True

        faturamentos.append(
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=1800.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=1800.00,
                pago=pagou_mes_passado, # No stress a farmácia enrola
                data_pagamento=date(mes_passado.year, mes_passado.month, 15) if pagou_mes_passado else None
            )
        )
        self._add_and_commit(faturamentos)
