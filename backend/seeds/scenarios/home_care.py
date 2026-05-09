from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

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

        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Gestão Operacional de Escalas",
                visitas_previstas_mes=4,
                data_inicio=date(2025, 1, 15)
            )
            self.db.add(contrato)
            self.db.flush()
        
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        hoje_date = date.today()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)

        visitas = []
        pendencias = []
        eventos = []
        
        # Visita de rotina (Mês passado)
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
        
        # Causalidade: Rotina gerou uma pendência
        pendencias.append(create_causal_pendency(v_rotina_1, "Atualizar banco de currículos de técnicos substitutos", dias_prazo=10))

        if mode in ["realistic", "stress"]:
            v_emergencia = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-5) - timedelta(hours=14),
                duracao_minutos=180,
                tipo_visita="urgente",
                modalidade="presencial",
                descricao="EMERGÊNCIA: Furo na escala noturna (Plantão UTI Domiciliar)",
                resultados="Remanejamento feito de urgência. Plantão coberto, mas gerou hora extra."
            )
            self._add_and_commit([v_emergencia])
            
            # Causalidade: Emergência gerou pendência crítica
            pendencias.append(create_causal_pendency(v_emergencia, "Notificar coordenação sobre hora extra gerada", responsavel="Adriano", atrasada=True))
            
            # Causalidade: Emergência gerou Evento Crítico
            eventos.append(create_causal_event(v_emergencia, "Falha de Escala: Risco à vida evitado com cobertura urgente.", acao_tomada="Remanejamento imediato de técnico"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Faturamentos
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=4500.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=4500.00,
                pago=True,
                data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 10)
            )
        ]
        
        valor_extra_mes = 500.00 if mode in ["realistic", "stress"] else 0.00
        pago_mes = False if mode == "stress" else True

        faturamentos.append(
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=4500.00,
                valor_extra=valor_extra_mes,
                desconto=0.00,
                valor_total=4500.00 + valor_extra_mes,
                pago=pago_mes,
                data_pagamento=date(mes_passado.year, mes_passado.month, 10) if pago_mes else None
            )
        )
        self._add_and_commit(faturamentos)
