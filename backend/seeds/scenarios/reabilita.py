from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

class ReabilitaScenario(Scenario):
    """
    Cenário: Clínica REABILITA
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="REABILITA",
            tipo_instituicao="Clínica",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="média"
        )

        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Gestão de Faturamento e Processos",
                visitas_previstas_mes=3,
                data_inicio=date(2025, 1, 10)
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
        
        v_rotina = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-12),
            duracao_minutos=150,
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Análise de Glosas - Lote Anterior",
            resultados="Identificada falha na autorização prévia pelo setor de recepção."
        )
        self._add_and_commit([v_rotina])

        # Causalidade: Análise de glosa exige refaturamento imediato
        pendencias.append(create_causal_pendency(v_rotina, "Refaturar lote com guias corrigidas (Recurso de Glosa)", responsavel="Equipe Cliente", atrasada=True))

        if mode in ["realistic", "stress"]:
            v_treinamento = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-4),
                duracao_minutos=180,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="Treinamento Equipe de Recepção (Autorizações)",
                resultados="Novo fluxo validado com a equipe."
            )
            self._add_and_commit([v_treinamento])
            pendencias.append(create_causal_pendency(v_treinamento, "Monitorar índice de erro nas autorizações da próxima semana", responsavel="Adriano", dias_prazo=7))

        if mode == "stress":
            eventos.append(create_causal_event(v_rotina, "Explosão de Glosas: Lote de 50 guias negadas pelo Bradesco Saúde.", acao_tomada="Protocolado recurso administrativo"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=2800.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=2800.00,
                pago=True,
                data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 15)
            )
        ]

        valor_extra_treinamento = 200.00 if mode in ["realistic", "stress"] else 0.00

        faturamentos.append(
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=2800.00,
                valor_extra=valor_extra_treinamento,
                desconto=0.00,
                valor_total=2800.00 + valor_extra_treinamento,
                pago=True,
                data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            )
        )
        self._add_and_commit(faturamentos)
