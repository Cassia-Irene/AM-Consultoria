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
            nome="FarmaVida",
            tipo_instituicao="Farmácia",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="baixa"
        )

        # 1. Contatos
        self.add_contato(cliente, "Dr. André", "Farmacêutico RT", "Técnico")
        self.add_contato(cliente, "Carla Meireles", "Gerente Comercial", "Administrativo")

        # 2. Contrato
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
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 1800.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Otimização de Estoque
        projeto = self.add_projeto(contrato, "Otimização de Curva ABC", valor_total=1000.00)
        self._add_and_commit([
            Entrega(id_projeto=projeto.id_projeto, descricao="Análise de Giro", data_entrega_prevista=dois_meses_atras, entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Implementação de Alertas", data_entrega_prevista=mes_passado, entregue=True)
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=500.00, data_pagamento_prevista=dois_meses_atras, pago=True, data_pagamento=dois_meses_atras),
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=2, valor_parcela=500.00, data_pagamento_prevista=mes_passado, pago=True, data_pagamento=mes_passado)
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
