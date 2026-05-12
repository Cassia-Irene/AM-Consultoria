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
            nome="Lar São Francisco de Cuidados para Idosos",
            tipo_instituicao="ILPI Privada",
            cidade="São Luís/MA",
            status="ativo",
            nivel_complexidade="alta",
            observacoes_gerais="A Conceição é extremamente comprometida com cuidado, mas evita conflitos administrativos. A equipe assistencial é emocionalmente sobrecarregada. Quando há incidente com residente, tudo vira prioridade máxima."
        )

        # 1. Contatos
        self.add_contato(cliente, "Conceição Ribeiro", "Diretora / Operacional", "Institucional")
        self.add_contato(cliente, "Patrícia Ribeiro", "Administrativo Financeiro / Decisora parcial", "Financeiro")
        self.add_contato(cliente, "Dr. Álvaro Mendes", "Médico parceiro recorrente", "Técnico")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Diagnóstico organizacional, revisão de processos assistenciais, acompanhamento mensal",
                visitas_previstas_mes=6,
                inclui_relatorio=True,
                data_inicio=date(2025, 2, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 8500.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Fluxo de Medicação
        p_med = self.add_projeto(contrato, "Revisão do fluxo de medicação", valor_total=2500.00)
        self._add_and_commit([
            Entrega(id_projeto=p_med.id_projeto, descricao="Mapeamento de riscos", data_entrega_prevista=mes_passado, entregue=True),
        ])
        
        # 2. Projeto: Documentação VISA
        p_visa = self.add_projeto(contrato, "Organização documental para VISA", valor_total=3000.00)
        self._add_and_commit([
            Entrega(id_projeto=p_visa.id_projeto, descricao="Auditoria documental", data_entrega_prevista=hoje_date, entregue=False),
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
