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

class CAPSScenario(Scenario):
    """
    Cenário: CAPS II Renascer
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="CAPS II Renascer",
            tipo_instituicao="Saúde Mental Pública",
            cidade="São Luís/MA",
            status="ativo",
            nivel_complexidade="alta",
            observacoes_gerais="Ambiente muito sensível emocionalmente. A equipe trabalha sobrecarregada. Demandas urgentes surgem sem previsibilidade. Muitas decisões acontecem informalmente."
        )

        # 1. Contatos
        self.add_contato(cliente, "Dr. Augusto Leal", "Coordenador", "Decisor")
        self.add_contato(cliente, "Márcia Costa", "Assistente Social", "Operacional")
        self.add_contato(cliente, "Joana Nunes", "Administrativo da Secretaria", "Operacional")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Apoio organizacional e fluxo operacional",
                visitas_previstas_mes=4,
                inclui_relatorio=True,
                data_inicio=date(2024, 8, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 6200.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Fluxo RAAS
        p_raas = self.add_projeto(contrato, "Revisão do fluxo RAAS", valor_total=1200.00)
        self._add_and_commit([
            Entrega(id_projeto=p_raas.id_projeto, descricao="Mapeamento de gargalos", data_entrega_prevista=dois_meses_atras, entregue=True),
        ])
        
        # 2. Projeto: Usuários Intensivos
        p_intensivo = self.add_projeto(contrato, "Acompanhamento de usuários intensivos", valor_total=1500.00)
        self._add_and_commit([
            Entrega(id_projeto=p_intensivo.id_projeto, descricao="Desenho de novos protocolos", data_entrega_prevista=mes_passado, entregue=True),
        ])

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
        pendencias.append(create_causal_pendency(v_auditoria, "Plano de ação para Vigilância Sanitária", responsavel="AM Consultoria", atrasada=True))

        if mode in ["realistic", "stress"]:
            # Visita Extra: Crise Operacional (Surtos)
            v_crise = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-8),
                duracao_minutos=180,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="CRIAÇÃO DE FLUXO: Gestão de crise após incidente grave no pátio",
                resultados="Novos protocolos de contenção definidos."
            )
            self._add_and_commit([v_crise])
            
            contato_ricardo = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            self.db.add(VisitaExtra(id_visita=v_crise.id_visita, solicitado_por=contato_ricardo.id_contato))

            eventos.append(create_causal_event(v_auditoria, "Risco Sanitário: Autuação na farmácia", acao_tomada="Protocolado pedido de prazo"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro (CAPS costuma atrasar)
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=3200.00, valor_extra=0.00, desconto=0.00, valor_total=3200.00,
                pago=True, data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=3200.00, valor_extra=0.00, desconto=0.00, valor_total=3200.00,
                pago=False, data_pagamento=None
            )
        ]
        self._add_and_commit(faturamentos)
