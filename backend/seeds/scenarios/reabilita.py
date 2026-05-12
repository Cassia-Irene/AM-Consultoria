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

class ReabilitaScenario(Scenario):
    """
    Cenário: Clínica REABILITA
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="REABILITA Centro de Reabilitação",
            tipo_instituicao="Clínica de Reabilitação",
            cidade="São Luís/MA",
            status="ativo",
            nivel_complexidade="alta",
            observacoes_gerais="Equipe técnica muito boa, mas gestão financeira confusa. A Fernanda muda prioridades frequentemente conforme pressão dos convênios."
        )

        # 1. Contatos
        self.add_contato(cliente, "Dra. Fernanda Caldas", "Sócia-proprietária", "Decisor")
        self.add_contato(cliente, "Cláudia Mendes", "Recepção administrativa", "Operacional")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Organização operacional e faturamento",
                visitas_previstas_mes=4,
                inclui_relatorio=True,
                data_inicio=date(2025, 3, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 7000.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Convênios
        p_conv = self.add_projeto(contrato, "Revisão de autorização de convênios", valor_total=2800.00)
        self._add_and_commit([
            Entrega(id_projeto=p_conv.id_projeto, descricao="Mapeamento de glosas", data_entrega_prevista=mes_passado, entregue=True),
        ])
        
        # 2. Projeto: Sessões e Metas
        p_metas = self.add_projeto(contrato, "Controle de sessões e metas", valor_total=2200.00)
        self._add_and_commit([
            Entrega(id_projeto=p_metas.id_projeto, descricao="Planilha de produtividade", data_entrega_prevista=hoje_date, entregue=False),
        ])

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
            resultados="Identificada falha na autorização prévia."
        )
        self._add_and_commit([v_rotina])
        pendencias.append(create_causal_pendency(v_rotina, "Refaturar lote corrigido", responsavel="Equipe Cliente", atrasada=True))

        if mode in ["realistic", "stress"]:
            # Visita Extra: Falha Técnica em Equipamento
            v_falha = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-4),
                duracao_minutos=120,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="SUPORTE TÉCNICO: Falha em equipamento e revisão de segurança",
                resultados="Laudo emitido e equipamento enviado para manutenção."
            )
            self._add_and_commit([v_falha])
            
            contato_elen = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            self.db.add(VisitaExtra(id_visita=v_falha.id_visita, solicitado_por=contato_elen.id_contato))

            eventos.append(create_causal_event(v_rotina, "Explosão de Glosas: Lote negado", acao_tomada="Recurso administrativo"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=2800.00, valor_extra=0.00, desconto=0.00, valor_total=2800.00,
                pago=True, data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 15)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=2800.00, valor_extra=0.00, desconto=0.00, valor_total=2800.00,
                pago=True, data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            )
        ]
        self._add_and_commit(faturamentos)
