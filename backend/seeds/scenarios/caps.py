from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, data_relativa_dias, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

class CAPSScenario(Scenario):
    """
    Cenário: CAPS II Renascer
    Realidade Operacional: Instituição Pública, alta pressão regulatória (RAAS/DATASUS),
    burocracia, auditorias da vigilância sanitária. 
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="CAPS II Renascer",
            tipo_instituicao="Pública",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="alta"
        )

        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Adequação Regulatória e Gestão SUS",
                visitas_previstas_mes=4,
                inclui_relatorio=True,
                data_inicio=date(2024, 8, 1)
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
            data_hora=data_relativa_datetime(-15),
            duracao_minutos=240,
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Acompanhamento de Inspeção da Vigilância Sanitária",
            resultados="Autuação recebida por armazenamento incorreto de psicotrópicos."
        )
        self._add_and_commit([v_auditoria])

        # Causalidade: Auditoria gera pendência urgente
        pendencias.append(create_causal_pendency(v_auditoria, "Elaborar plano de ação para resposta à autuação da VISA", responsavel="Adriano", atrasada=True))

        if mode in ["realistic", "stress"]:
            v_rotina = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-3),
                duracao_minutos=120,
                tipo_visita="rotineira",
                modalidade="presencial",
                descricao="Revisão de faturamento RAAS/DATASUS",
                resultados="Lotes enviados com sucesso, taxa de rejeição caiu 15%."
            )
            self._add_and_commit([v_rotina])
            pendencias.append(create_causal_pendency(v_rotina, "Validar relatórios de produção do DATASUS", responsavel="Equipe Cliente", dias_prazo=5))

        if mode in ["realistic", "stress"]:
            eventos.append(create_causal_event(v_auditoria, "Risco Sanitário: Autuação da Vigilância Sanitária na farmácia interna.", acao_tomada="Protocolado pedido de prazo"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro (CAPS costuma atrasar)
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=3200.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=3200.00,
                pago=True,
                data_pagamento=date(mes_passado.year, mes_passado.month, 15) # Pagamento com 45 dias
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=3200.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=3200.00,
                pago=False, 
                data_pagamento=None
            )
        ]
        self._add_and_commit(faturamentos)
