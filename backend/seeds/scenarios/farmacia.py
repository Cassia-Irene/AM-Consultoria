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

class FarmaciaScenario(Scenario):
    """
    Cenário: FarmaVida
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="FarmaVida Farmácia Comunitária",
            tipo_instituicao="Farmácia Popular",
            cidade="Caxias/MA",
            status="ativo",
            nivel_complexidade="média",
            observacoes_gerais="Operação muito baseada na memória do dono. Resistência inicial ao uso de sistema. Grande preocupação com perda financeira por erro operacional."
        )

        # 1. Contatos
        self.add_contato(cliente, "Raimundo Alves", "Proprietário", "Decisor")
        self.add_contato(cliente, "Luciana Alves", "Financeiro", "Financeiro")
        self.add_contato(cliente, "Rafael Sousa", "Farmacêutico Responsável", "Técnico")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Organização operacional e rastreabilidade",
                visitas_previstas_mes=2,
                inclui_relatorio=False,
                data_inicio=date(2024, 9, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Por visita", 3800.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Dispensação
        p_disp = self.add_projeto(contrato, "Controle de dispensação", valor_total=1500.00)
        self._add_and_commit([
            Entrega(id_projeto=p_disp.id_projeto, descricao="Mapeamento de perdas", data_entrega_prevista=mes_passado, entregue=True),
        ])
        
        # 2. Projeto: Fluxo Popular
        p_pop = self.add_projeto(contrato, "Revisão de fluxo Farmácia Popular", valor_total=1800.00)
        self._add_and_commit([
            Entrega(id_projeto=p_pop.id_projeto, descricao="Treinamento de balcão", data_entrega_prevista=hoje_date, entregue=False),
        ])

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
            resultados="Encontrada divergência em 3 receitas."
        )
        self._add_and_commit([v_auditoria])

        pendencias.append(create_causal_pendency(v_auditoria, "Corrigir as 3 receitas irregulares", responsavel="Equipe Cliente", atrasada=True))

        if mode in ["realistic", "stress"]:
            # Visita Extra: Auditoria de Emergência (Geralmente SNGPC fora)
            v_emergencia = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-2),
                duracao_minutos=90,
                tipo_visita="urgente",
                modalidade="remota",
                descricao="EMERGÊNCIA: Suporte a travamento de sistema SNGPC",
                resultados="Inventário retransmitido com sucesso."
            )
            self._add_and_commit([v_emergencia])
            
            contato_andre = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            self.db.add(VisitaExtra(id_visita=v_emergencia.id_visita, solicitado_por=contato_andre.id_contato))

            eventos.append(create_causal_event(v_auditoria, "Alerta SNGPC: Falha de transmissão", acao_tomada="Suporte TI"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=1800.00, valor_extra=0.00, desconto=0.00, valor_total=1800.00,
                pago=True, data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 15)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=1800.00, valor_extra=0.00, desconto=0.00, valor_total=1800.00,
                pago=True, data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            )
        ]
        self._add_and_commit(faturamentos)
