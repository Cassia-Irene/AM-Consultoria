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
            nome="CuidaBem Home Care",
            tipo_instituicao="Home Care",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="alta"
        )

        # 1. Contatos
        contato_gestor = self.add_contato(cliente, "Dra. Márcia Silva", "Diretora Operacional", "Gestão de Escalas")
        self.add_contato(cliente, "Roberto Santos", "Coordenador de Enfermagem", "Ponto Focal")

        # 2. Contrato com Histórico
        contrato_antigo = self.db.query(Contrato).filter(
            Contrato.id_cliente == cliente.id_cliente,
            Contrato.data_fim != None
        ).first()

        if not contrato_antigo:
            contrato_antigo = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Consultoria Inicial em Escalas",
                visitas_previstas_mes=2,
                data_inicio=date(2024, 1, 1),
                data_fim=date(2024, 12, 31)
            )
            self.db.add(contrato_antigo)
            self.db.flush()

        contrato = self.db.query(Contrato).filter(
            Contrato.id_cliente == cliente.id_cliente,
            Contrato.data_fim == None
        ).first()

        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Gestão Operacional de Escalas + Auditoria de Plantão",
                visitas_previstas_mes=4,
                data_inicio=date(2025, 1, 1)
            )
            self.db.add(contrato)
            self.db.flush()
            
            # Registrar Histórico de Renovação
            self.registrar_historico(contrato_antigo.id_contrato, contrato.id_contrato, "Renovação Anual com ampliação de escopo", date(2025, 1, 1))

        # 3. Pagamentos do Contrato
        self.add_contrato_pagamento(contrato, "Mensal", 4500.00)
        self.add_contrato_pagamento(contrato, "Por Visita", 500.00) # Valor para visitas extras

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projetos e Entregas
        projeto = self.add_projeto(contrato, "Digitalização de Escalas 2026", valor_total=3000.00)
        
        entregas = [
            Entrega(id_projeto=projeto.id_projeto, descricao="Mapeamento de Processos", data_entrega_prevista=subtrair_meses(hoje_date, 1), entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Treinamento da Equipe", data_entrega_prevista=hoje_date, entregue=False),
            # Entrega Atrasada em modo stress
            Entrega(id_projeto=projeto.id_projeto, descricao="Configuração de Software", data_entrega_prevista=subtrair_meses(hoje_date, 1), entregue=False) if mode == "stress" else None
        ]
        self._add_and_commit([e for e in entregas if e])

        parcelas = [
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=1500.00, data_pagamento_prevista=subtrair_meses(hoje_date, 1), pago=True, data_pagamento=subtrair_meses(hoje_date, 1)),
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=2, valor_parcela=1500.00, data_pagamento_prevista=hoje_date, pago=False)
        ]
        self._add_and_commit(parcelas)

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
