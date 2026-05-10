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
            nome="REABILITA",
            tipo_instituicao="Clínica",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="média"
        )

        # 1. Contatos
        self.add_contato(cliente, "Dra. Elen", "Dona/Fisioterapeuta", "Institucional")
        self.add_contato(cliente, "Suzana", "Faturamento", "Ponto Focal")

        # 2. Contrato
        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Gestão de Faturamento e Processos",
                visitas_previstas_mes=3,
                data_inicio=date(2025, 1, 10)
            )
            self.db.add(contrato)
            self.db.flush()
        
        # 3. Pagamento
        self.add_contrato_pagamento(contrato, "Mensal", 2800.00)

        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = get_hoje_date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        # 1. Projeto: Nova Ala de Fisioterapia
        projeto = self.add_projeto(contrato, "Expansão Ala Sul", valor_total=3000.00)
        self._add_and_commit([
            Entrega(id_projeto=projeto.id_projeto, descricao="Planta Técnica", data_entrega_prevista=dois_meses_atras, entregue=True),
            Entrega(id_projeto=projeto.id_projeto, descricao="Lista de Equipamentos", data_entrega_prevista=mes_passado, entregue=True)
        ])
        self._add_and_commit([
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=1, valor_parcela=1500.00, data_pagamento_prevista=dois_meses_atras, pago=True, data_pagamento=dois_meses_atras),
            ProjetoParcela(id_projeto=projeto.id_projeto, numero_parcela=2, valor_parcela=1500.00, data_pagamento_prevista=mes_passado, pago=True, data_pagamento=mes_passado)
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
