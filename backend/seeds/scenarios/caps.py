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
            tipo_instituicao="Pública",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="alta"
        )

        # 1. Contatos
        contato_dir = self.add_contato(cliente, "Dr. Ricardo Alencar", "Diretor Geral", "Administrativo")
        self.add_contato(cliente, "Enf. Lúcia Mendes", "Coord. Enfermagem", "Ponto Focal")

        # 2. Contrato
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
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 3200.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projetos: Prontuário Eletrônico
        projeto = self.add_projeto(contrato, "Implantação Prontuário Digital", valor_total=4000.00)
        self._add_and_commit([
            Entrega(id_projeto=projeto.id_projeto, descricao="Migração de Dados Papel", data_entrega_prevista=dois_meses_atras, entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Customização de Telas RAAS", data_entrega_prevista=mes_passado, entregue=False)
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=2000.00, data_pagamento_prevista=dois_meses_atras, pago=True, data_pagamento=dois_meses_atras),
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=2, valor_parcela=2000.00, data_pagamento_prevista=mes_passado, pago=False)
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
        pendencias.append(create_causal_pendency(v_auditoria, "Plano de ação para Vigilância Sanitária", responsavel="Adriano", atrasada=True))

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
