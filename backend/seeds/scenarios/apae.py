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
            nome="APAE de Bacabal",
            tipo_instituicao="Educação Especial",
            cidade="Bacabal/MA",
            status="ativo",
            nivel_complexidade="alta",
            observacoes_gerais="Instituição muito dependente do conhecimento informal da Neuza. Equipe pequena para demanda enorme. Sempre existe sensação de urgência acumulada."
        )

        # 1. Contatos
        self.add_contato(cliente, "Neuza Farias", "Diretora pedagógica", "Decisor")
        self.add_contato(cliente, "Carlos Henrique", "Administrativo", "Operacional")
        self.add_contato(cliente, "Juliana Lopes", "Psicologia", "Técnico")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Estruturação multiprofissional",
                visitas_previstas_mes=2,
                inclui_relatorio=True,
                data_inicio=date(2024, 4, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal + Projeto", 9000.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Revisão dos PIAs
        p_pias = self.add_projeto(contrato, "Revisão dos PIAs", valor_total=3500.00, status="concluído")
        self._add_and_commit([
            Entrega(id_projeto=p_pias.id_projeto, descricao="Mapeamento de alunos", data_entrega_prevista=dois_meses_atras, entregue=True),
        ])
        
        # 2. Projeto: Atendimentos Integrados
        p_integ = self.add_projeto(contrato, "Organização integrada de atendimentos", valor_total=2500.00)
        self._add_and_commit([
            Entrega(id_projeto=p_integ.id_projeto, descricao="Novo fluxo de agendamento", data_entrega_prevista=hoje_date, entregue=False),
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
