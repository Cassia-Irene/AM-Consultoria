from datetime import date
from seeds.scenarios.base import Scenario
from seeds.utils import subtrair_meses, data_relativa_datetime, data_relativa_dias, create_causal_pendency, create_causal_event
from src.models import Cliente, Contrato, Visita, FaturamentoCliente

class APAEScenario(Scenario):
    """
    Cenário: APAE Bacabal
    Realidade Operacional: Múltiplos convênios, necessidade de prestação de contas rigorosa (PIA),
    auditorias longas, imersões e deslocamento físico.
    """

    def generate_structure(self):
        cliente = self.get_or_create_cliente(
            nome="APAE Bacabal",
            tipo_instituicao="Filantrópica",
            cidade="Bacabal",
            status="ativo",
            nivel_complexidade="alta"
        )

        contrato = self.db.query(Contrato).filter(Contrato.id_cliente == cliente.id_cliente).first()
        if not contrato:
            contrato = Contrato(
                id_cliente=cliente.id_cliente,
                servicos_contratados="Adequação de Processos e PIA",
                visitas_previstas_mes=2,
                inclui_relatorio=True,
                data_inicio=date(2025, 6, 1)
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
        
        # 1. Visita de Imersão (Passado)
        v_imersao = Visita(
            id_contrato=contrato.id_contrato,
            status="realizada",
            data_hora=data_relativa_datetime(-10),
            duracao_minutos=480, # 8 horas de imersão
            tipo_visita="rotineira",
            modalidade="presencial",
            descricao="Imersão Bacabal - Auditoria de Convênios",
            resultados="Identificada divergência no rateio do SUS. Mapeamento completo concluído."
        )
        visitas.append(v_imersao)
        self._add_and_commit(visitas) # Commit para pegar ID para as pendências

        # Causalidade: Imersão gera pendência longa
        pendencias.append(create_causal_pendency(v_imersao, "Revisar planilha de rateio do convênio estadual", responsavel="Adriano", dias_prazo=15))

        if mode in ["realistic", "stress"]:
            v_reuniao_remota = Visita(
                id_contrato=contrato.id_contrato,
                status="realizada",
                data_hora=data_relativa_datetime(-2),
                duracao_minutos=90,
                tipo_visita="urgente",
                modalidade="remota",
                descricao="Alinhamento sobre Prestação de Contas",
                resultados="Orientação passada para o financeiro local."
            )
            self._add_and_commit([v_reuniao_remota])
            pendencias.append(create_causal_pendency(v_reuniao_remota, "Cobrar assinatura da diretoria na ata de auditoria", atrasada=True))

        if mode == "stress":
            eventos.append(create_causal_event(v_imersao, "Atraso no Repasse: Prefeitura atrasou repasse da subvenção, cliente em risco de fluxo de caixa.", acao_tomada="Ofício enviado à SMS"))

        self._add_and_commit(pendencias)
        self._add_and_commit(eventos)

        # 5. Financeiro
        faturamentos = [
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(dois_meses_atras.year, dois_meses_atras.month, 1),
                valor_base=3800.00,
                valor_extra=0.00,
                desconto=0.00,
                valor_total=3800.00,
                pago=True,
                data_pagamento=date(dois_meses_atras.year, dois_meses_atras.month, 5)
            )
        ]
        
        # Causalidade Financeira
        valor_extra_viagem = 400.00 if mode in ["realistic", "stress"] else 0.00
        pago_mes = False if mode == "stress" else True

        faturamentos.append(
            FaturamentoCliente(
                id_contrato=contrato.id_contrato,
                mes_ano=date(mes_passado.year, mes_passado.month, 1),
                valor_base=3800.00,
                valor_extra=valor_extra_viagem, # Deslocamento/Viagem
                desconto=0.00,
                valor_total=3800.00 + valor_extra_viagem,
                pago=pago_mes,
                data_pagamento=date(mes_passado.year, mes_passado.month, 5) if pago_mes else None
            )
        )
        self._add_and_commit(faturamentos)
