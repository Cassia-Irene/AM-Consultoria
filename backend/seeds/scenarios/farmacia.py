from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

class FarmaciaScenario(Scenario):
    """
    Cenário: FarmaVida
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="FarmaVida",
            tipo_instituicao="Farmácia",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="baixa"
        )

        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Auditoria Regulatória e Farmácia Popular",
                visitas_previstas_mes=2,
                data_inicio=date(2025, 2, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = date.today()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        visitas = []
        pendencias = []
        eventos = []
        
        v_auditoria = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-6),
            duracao_minutos=120,
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Conferência de Lotes - Farmácia Popular",
            resultados="Encontrada divergência em 3 receitas (falta de assinatura médica)."
        )
        self._add_and_commit([v_auditoria])

        # Causalidade: Auditoria gera pendências regulatórias
        pendencias.append(create_causal_pendency(v_auditoria, "Notificar prescritores para correção das 3 receitas irregulares", responsavel="Equipe Cliente", atrasada=True))
        pendencias.append(create_causal_pendency(v_auditoria, "Atualizar inventário no sistema SNGPC", responsavel="Adriano", dias_prazo=5))

        if mode == "stress":
            eventos.append(create_causal_event(v_auditoria, "Alerta SNGPC: Falha de transmissão de inventário no sistema do governo.", acao_tomada="Reenvio manual via suporte TI"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
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
                pago=pagou_mes_passado,
                data_pagamento=date(mes_passado.year, mes_passado.month, 15) if pagou_mes_passado else None
            )
        )
        self._add_and_commit(faturamentos)
