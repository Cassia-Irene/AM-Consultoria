from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

class ILPIScenario(Scenario):
    """
    Cenário: Lar São Francisco (ILPI)
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="Lar São Francisco",
            tipo_instituicao="ILPI",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="média"
        )

        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Suporte Técnico e Gestão de Incidentes",
                visitas_previstas_mes=2,
                data_inicio=date(2024, 10, 1)
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
        
        v_incidente = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-8),
            duracao_minutos=180,
            tipo_visita="urgente",
            modalidade="presencial",
            descricao="Mediação de conflito familiar pós-incidente (Queda)",
            resultados="Família acalmada. Protocolo de prevenção de quedas revisado."
        )
        self._add_and_commit([v_incidente])
        
        # Causalidade: Incidente gera pendências
        pendencias.append(create_causal_pendency(v_incidente, "Treinar cuidadores no novo protocolo de prevenção de quedas", responsavel="Adriano", dias_prazo=10))
        pendencias.append(create_causal_pendency(v_incidente, "Cotar fornecedor para tapetes antiderrapantes", responsavel="Equipe Cliente", atrasada=True))

        if mode in ["realistic", "stress"]:
            eventos.append(create_causal_event(v_incidente, "Incidente Operacional: Queda de idoso no banho.", acao_tomada="Revisão imediata de protocolo"))

        if mode == "stress":
            eventos.append(create_causal_event(v_incidente, "Risco de Processo Judicial: Família do idoso ameaçou acionar a ILPI.", acao_tomada="Reunião com jurídico"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
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

        desconto_mes = 1000.00 if mode == "stress" else (500.00 if mode == "realistic" else 0.00)

        faturamentos.append(
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=2500.00,
                valor_extra=0.00,
                desconto=desconto_mes,
                valor_total=2500.00 - desconto_mes,
                pago=True,
                data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            )
        )
        self._add_and_commit(faturamentos)
