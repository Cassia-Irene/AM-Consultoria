from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import (
    subtrair_meses, data_relativa_datetime, create_causal_pendency, 
    create_causal_event, get_hoje_date
)
from src.models import (
    Cliente, Contrato, Visita, FaturamentoCliente, Entrega, 
    ProjetoParcela, VisitaExtra
)

class HomeCareScenario(Scenario):
    """
    Cenário: CuidaBem Home Care
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="CuidaBem Serviços Domiciliares",
            tipo_instituicao="Home Care",
            cidade="São Luís/MA",
            status="ativo",
            nivel_complexidade="alta",
            observacoes_gerais="Cliente extremamente acelerado. Tudo acontece via WhatsApp. Marcela toma decisão emocional sob pressão. Mudanças de escala acontecem o tempo todo."
        )

        # 1. Contatos
        self.add_contato(cliente, "Marcela Viana", "Fundadora", "Decisor")
        self.add_contato(cliente, "Felipe Braga", "Coordenação Operacional", "Operacional")
        self.add_contato(cliente, "Amanda Sousa", "Financeiro", "Financeiro")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Estruturação operacional e escala",
                visitas_previstas_mes=8,
                inclui_relatorio=False,
                data_inicio=date(2025, 1, 1)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal + Projetos paralelos", 12000.00)

        return cliente, contrato

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Controle de Cuidadores
        p_ctrl = self.add_projeto(contrato, "Estruturação de controle de cuidadores", valor_total=3000.00)
        self._add_and_commit([
            Entrega(id_projeto=p_ctrl.id_projeto, descricao="Planilha de controle ativa", data_entrega_prevista=mes_passado, entregue=True),
        ])
        
        # 2. Projeto: Redesenho de Escala
        p_esc = self.add_projeto(contrato, "Redesenho da escala de plantão", valor_total=2000.00)
        self._add_and_commit([
            Entrega(id_projeto=p_esc.id_projeto, descricao="Nova grade horária", data_entrega_prevista=hoje_date, entregue=False),
        ])

        visitas = []
        pendencias = []
        eventos = []
        
        # Visita de rotina
        v_rotina_1 = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-20),
            duracao_minutos=120,
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Revisão mensal de escalas",
            resultados="Escalas validadas, porém 2 técnicos de enfermagem apresentaram atestado."
        )
        self._add_and_commit([v_rotina_1])
        pendencias.append(create_causal_pendency(v_rotina_1, "Atualizar banco de currículos de técnicos", dias_prazo=10))

        if mode in ["realistic", "stress"]:
            v_emergencia = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-5),
                duracao_minutos=180,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="EMERGÊNCIA: Furo na escala noturna",
                resultados="Plantão coberto com reserva técnica."
            )
            self._add_and_commit([v_emergencia])
            
            # Marcar como VISITA EXTRA solicitada pela Márcia
            contato_marcia = self.db.query(Cliente).join(Cliente.contatos).filter(Cliente.id_cliente == cliente.id_cliente).first().contatos[0]
            v_extra = VisitaExtra(id_visita=v_emergencia.id_visita, solicitado_por=contato_marcia.id_contato)
            self.db.add(v_extra)

            pendencias.append(create_causal_pendency(v_emergencia, "Notificar coordenação sobre hora extra", responsavel="Adriano", atrasada=True))
            eventos.append(create_causal_event(v_emergencia, "Falha de Escala Crítica", acao_tomada="Remanejamento urgente"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Faturamentos
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=4500.00, valor_extra=0.00, desconto=0.00, valor_total=4500.00,
                pago=True, data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 10)
            ),
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=4500.00, valor_extra=500.00 if mode != "simple" else 0.0, 
                desconto=0.00, valor_total=5000.00 if mode != "simple" else 4500.0,
                pago=True if mode == "realistic" else False, 
                data_pagamento=date(mes_passado.year, mes_passado.month, 10) if mode == "realistic" else None
            )
        ]
        self._add_and_commit(faturamentos)
