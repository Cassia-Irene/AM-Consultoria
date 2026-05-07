from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import get_hoje, subtrair_meses, data_relativa_dias, data_relativa_horas
from src.models import Cliente, Contrato, Visita, Pendencia, FaturamentoCliente, EventoCritico

class CAPSScenario(Scenario):
    """
    Cenário: CAPS II Renascer
    Realidade Operacional: Instituição Pública, alta pressão regulatória (RAAS/DATASUS),
    burocracia, auditorias da vigilância sanitária. 
    Pagamentos costumam sofrer atrasos devido a empenhos e burocracia governamental.
    """

    def generate_structure(self):
        cliente = Cliente(
            nome="CAPS II Renascer",
            tipo_instituicao="Pública",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="alta"
        )
        self.db.add(cliente)
        self.db.flush()

        contrato = Contrato(
            id_cliente=cliente.id_cliente,
            servicos_contratados="Adequação Regulatória e Gestão SUS",
            visitas_previstas_mes=4,
            valor_mensal=3200.00,
            status="ativo",
            data_inicio=date(2024, 8, 1)
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
        
        v_auditoria = Visita(
            id_cliente=cliente.id_cliente,
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_dias(-15),
            duracao_estimada_minutos=240,
            modalidade="presencial",
            descricao="Acompanhamento de Inspeção da Vigilância Sanitária",
            resultados="Autuação recebida por armazenamento incorreto de psicotrópicos."
        )
        visitas.append(v_auditoria)

        # Causalidade: Auditoria gera pendência urgente
        pendencias.append(create_causal_pendency(v_auditoria, "Elaborar plano de ação para resposta à autuação da VISA", responsavel="Adriano", atrasada=True))

        if mode in ["realistic", "stress"]:
            v_rotina = Visita(
                id_cliente=cliente.id_cliente,
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_dias(-3),
                duracao_estimada_minutos=120,
                modalidade="presencial",
                descricao="Revisão de faturamento RAAS/DATASUS",
                resultados="Lotes enviados com sucesso, taxa de rejeição caiu 15%."
            )
            visitas.append(v_rotina)
            pendencias.append(create_causal_pendency(v_rotina, "Validar relatórios de produção do DATASUS", responsavel="Equipe Cliente", dias_prazo=5))

        if mode in ["realistic", "stress"]:
            eventos.append(create_causal_event(v_auditoria, "Risco Sanitário", "Autuação da Vigilância Sanitária na farmácia interna.", impacto="Crítico Real", resolvido=False))

        if mode == "stress":
            eventos.append(create_causal_event(v_auditoria, "Ameaça de Interdição", "Aviso formal da SMS alertando interdição se o plano não for entregue.", impacto="Crítico Real", resolvido=False))
            eventos = apply_stress_limits(eventos)

        self._add_and_commit(visitas)
        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(tres_meses_atras.year, tres_meses_atras.month, 1),
                valor_base=3200.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=3200.00,
                pago=True,
                data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 15) # Pagamento com 45 dias
            )
        ]

        # No CAPS o atraso é padrão (Realistic), mas no Demo a gente pode fingir que paga.
        pagou_atrasado = True if mode == "demo" else False

        faturamentos.extend([
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=3200.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=3200.00,
                pago=pagou_atrasado, 
                data_pagamento=date(mes_passado.year, mes_passado.month, 20) if pagou_atrasado else None
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=3200.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=3200.00,
                pago=False, # Empenho atrasado sempre
                data_pagamento=None
            )
        ])
        self._add_and_commit(faturamentos)
