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

class APAEScenario(Scenario):
    """
    Cenário: APAE Bacabal
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="APAE Bacabal",
            tipo_instituicao="Filantrópica",
            cidade="Bacabal",
            status="ativo",
            nivel_complexidade="alta"
        )

        # 1. Contatos
        contato_pres = self.add_contato(cliente, "Maria das Dores", "Presidente", "Institucional")
        self.add_contato(cliente, "João Kleber", "Contador", "Financeiro")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Adequação de Processos e PIA",
                visitas_previstas_mes=2,
                inclui_relatorio=True,
                data_inicio=date(2024, 6, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 3800.00)
        self.add_contrato_pagamento(contrato, "Por Visita", 800.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Mapeamento Curricular Inclusivo
        projeto = self.add_projeto(contrato, "Mapeamento Curricular Inclusivo", valor_total=2400.00)
        self._add_and_commit([
            Entrega(id_projeto=projeto.id_projeto, descricao="Diagnóstico Inicial", data_entrega_prevista=dois_meses_atras, entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Plano de Aula Adaptado", data_entrega_prevista=hoje_date, entregue=False)
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=1200.00, data_pagamento_prevista=dois_meses_atras, pago=True, data_pagamento=dois_meses_atras),
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=2, valor_parcela=1200.00, data_pagamento_prevista=mes_passado, pago=False)
        ])

        visitas = []
        pendencias = []
        eventos = []
        
        # Visita de Imersão
        v_imersao = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-10),
            duracao_minutos=480,
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Imersão Bacabal - Auditoria de Convênios",
            resultados="Identificada divergência no rateio do SUS."
        )
        self._add_and_commit([v_imersao])
        pendencias.append(create_causal_pendency(v_imersao, "Revisar rateio do convênio", responsavel="Adriano", dias_prazo=15))

        if mode in ["realistic", "stress"]:
            # Visita Extra: Suporte a Fiscalização do MEC/SEC
            v_extra = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-3),
                duracao_minutos=300,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="SUPORTE TÉCNICO: Fiscalização da Secretaria de Educação",
                resultados="Documentação apresentada sem ressalvas."
            )
            self._add_and_commit([v_extra])
            
            contato_maria = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            self.db.add(VisitaExtra(id_visita=v_extra.id_visita, solicitado_por=contato_maria.id_contato))

            if mode == "stress":
                eventos.append(create_causal_event(v_imersao, "Atraso no Repasse Municipal", acao_tomada="Ofício enviado à SMS"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=3800.00, valor_extra=0.00, desconto=0.00, valor_total=3800.00,
                pago=True, data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 5)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=3800.00, valor_extra=800.00 if mode != "simple" else 0.0,
                desconto=0.00, valor_total=4600.00 if mode != "simple" else 3800.0,
                pago=True, data_pagamento=date(mes_passado.year, mes_passado.month, 5)
            )
        ]
        self._add_and_commit(faturamentos)
