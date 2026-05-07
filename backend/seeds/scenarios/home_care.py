from datetime import date, timedelta
from seeds.scenarios.base import Scenario
from seeds.utils import get_hoje, subtrair_meses, data_relativa_dias, data_relativa_horas
from src.models import Cliente, Contrato, Visita, Pendencia, FaturamentoCliente, EventoCritico

class HomeCareScenario(Scenario):
    """
    Cenário: CuidaBem Home Care
    Realidade Operacional: Alta complexidade, visitas emergenciais noturnas, 
    substituição de cuidadores de última hora (falta na escala).
    """

    def generate_structure(self):
        cliente = Cliente(
            nome="CuidaBem Home Care",
            tipo_instituicao="Home Care",
            cidade="São Luís",
            status="ativo",
            nivel_complexidade="alta"
        )
        self.db.add(cliente)
        self.db.flush()

        contrato = Contrato(
            id_cliente=cliente.id_cliente,
            servicos_contratados="Gestão Operacional de Escalas",
            visitas_previstas_mes=4,
            valor_mensal=4500.00,
            status="ativo",
            data_inicio=date(2025, 1, 15)
        )
        self.db.add(contrato)
        self.db.flush()
        return cliente, contrato

    def simulate_timeline(self, cliente, contrato, mode="realistic"):
        from seeds.utils import create_causal_pendency, create_causal_event, apply_stress_limits
        hoje_date = get_hoje().date()
        mes_passado = subtrair_meses(hoje_date, 1)
        dois_meses_atras = subtrair_meses(hoje_date, 2)
        tres_meses_atras = subtrair_meses(hoje_date, 3)

        visitas = []
        pendencias = []
        eventos = []
        
        # Visita de rotina (Mês passado)
        v_rotina_1 = Visita(
            id_cliente=cliente.id_cliente,
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_dias(-20),
            duracao_estimada_minutos=120,
            modalidade="presencial",
            descricao="Revisão mensal de escalas",
            resultados="Escalas validadas, porém 2 técnicos de enfermagem apresentaram atestado."
        )
        visitas.append(v_rotina_1)
        
        # Causalidade: Rotina gerou uma pendência
        pendencias.append(create_causal_pendency(v_rotina_1, "Atualizar banco de currículos de técnicos substitutos", dias_prazo=10))

        # Visita emergencial (Apenas Realistic ou Stress)
        if mode in ["realistic", "stress"]:
            v_emergencia = Visita(
                id_cliente=cliente.id_cliente,
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_dias(-5) - timedelta(hours=14),
                duracao_estimada_minutos=180,
                modalidade="presencial",
                descricao="EMERGÊNCIA: Furo na escala noturna (Plantão UTI Domiciliar)",
                resultados="Remanejamento feito de urgência. Plantão coberto, mas gerou hora extra."
            )
            visitas.append(v_emergencia)
            
            # Causalidade: Emergência gerou pendência crítica
            pendencias.append(create_causal_pendency(v_emergencia, "Notificar coordenação sobre hora extra gerada", responsavel="Adriano", atrasada=True))
            
            # Causalidade: Emergência gerou Evento Crítico
            eventos.append(create_causal_event(v_emergencia, "Falha de Escala", "Risco à vida evitado com cobertura urgente.", impacto="Crítico Real"))

        if mode == "stress":
            # Gera mais emergências (Ruído Operacional Alto)
            for i in range(1, 4):
                v_stress = Visita(
                    id_cliente=cliente.id_cliente,
                    id_contrato=contrato.id_contrato,
                    status="cancelada",
                    data_hora=data_relativa_dias(-i*2),
                    duracao_estimada_minutos=60,
                    modalidade="presencial",
                    descricao=f"Tentativa de visita {i} cancelada",
                    resultados="Família desmarcou em cima da hora."
                )
                visitas.append(v_stress)
                eventos.append(create_causal_event(v_stress, "Desmarcação", "Ruído logístico de família.", impacto="Ruído Operacional", resolvido=True))
            
            # Limite de Saturação (Cap de ruído)
            eventos = apply_stress_limits(eventos, max_items=3)

        self._add_and_commit(visitas)
        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # Faturamentos (Causalidade Financeira)
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(tres_meses_atras.year, tres_meses_atras.month, 1),
                valor_base=4500.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=4500.00,
                pago=True,
                data_pagamento=date(tres_meses_atras.year, tres_meses_atras.month, 10)
            )
        ]
        
        # O mês passado reflete a emergência (valor extra)
        valor_extra_mes = 500.00 if mode in ["realistic", "stress"] else 0.00
        pago_mes = False if mode == "stress" else True # No stress o financeiro quebra

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
