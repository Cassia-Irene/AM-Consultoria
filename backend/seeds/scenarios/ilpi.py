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

        # 1. Contatos
        self.add_contato(cliente, "Irmã Tereza", "Superiora", "Institucional")
        self.add_contato(cliente, "Dr. Paulo", "Médico Responsável", "Técnico")

        # 2. Contrato
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
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 2500.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Nutrição Automatizada
        projeto = self.add_projeto(contrato, "Automação Nutricional", valor_total=1600.00)
        self._add_and_commit([
            Entrega(id_projeto=projeto.id_projeto, descricao="Mapeamento de Dietas", data_entrega_prevista=dois_meses_atras, entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Interface de Pesagem", data_entrega_prevista=mes_passado, entregue=True)
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=800.00, data_pagamento_prevista=dois_meses_atras, pago=True, data_pagamento=dois_meses_atras),
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=2, valor_parcela=800.00, data_pagamento_prevista=mes_passado, pago=True, data_pagamento=mes_passado)
        ])

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
            resultados="Família acalmada. Protocolo de quedas revisado."
        )
        self._add_and_commit([v_incidente])
        
        pendencias.append(create_causal_pendency(v_incidente, "Treinar cuidadores no novo protocolo", responsavel="Adriano", dias_prazo=10))

        if mode in ["realistic", "stress"]:
            # Visita Extra: Vigilância Sanitária
            v_visa = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-3),
                duracao_minutos=120,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="SUPORTE: Visita Inopinada da Vigilância Sanitária",
                resultados="Nenhuma irregularidade grave encontrada."
            )
            self._add_and_commit([v_visa])
            
            contato_tereza = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            self.db.add(VisitaExtra(id_visita=v_visa.id_visita, solicitado_por=contato_tereza.id_contato))

            eventos.append(create_causal_event(v_incidente, "Incidente: Queda de idoso no banho", acao_tomada="Revisão imediata de protocolo"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=2500.00, valor_extra=0.00, desconto=0.00, valor_total=2500.00,
                pago=True, data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 10)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=2500.00, valor_extra=0.00, desconto=0.00, valor_total=2500.00,
                pago=True, data_pagamento=date(mes_passado.year, mes_passado.month, 15)
            )
        ]
        self._add_and_commit(faturamentos)
