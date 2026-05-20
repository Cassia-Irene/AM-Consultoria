from datetime import date
from decimal import Decimal
from calendar import monthrange
from sqlalchemy.orm import Session
from src.models.tipo_pagamento import TipoPagamento
from src.models.contrato_pagamento import ContratoPagamento
from src.models.visita import Visita
from src.models.visita_extra import VisitaExtra

def _get_intervalo_mes(mes_ano: date):
    """Retorna o primeiro e último dia do mês."""
    ultimo_dia = monthrange(mes_ano.year, mes_ano.month)[1]
    inicio = mes_ano.replace(day=1)
    fim = mes_ano.replace(day=ultimo_dia)
    return inicio, fim


def calcular_valor_base(db: Session, id_contrato: int, mes_ano: date) -> tuple[Decimal, int]:
    inicio, fim = _get_intervalo_mes(mes_ano)

    # 1. Busca os IDs das visitas extras do contrato no mês
    ids_extras_list = db.query(VisitaExtra.id_visita).join(Visita).filter(
        Visita.id_contrato == id_contrato,
        Visita.data_hora >= inicio,
        Visita.data_hora <= fim
    ).all()
    ids_extras_list = [row[0] for row in ids_extras_list]

    # 2. Conta visitas normais (excluindo as extras)
    query = db.query(Visita).filter(
        Visita.id_contrato == id_contrato,
        Visita.data_hora >= inicio,
        Visita.data_hora <= fim
    )
    if ids_extras_list:
        query = query.filter(Visita.id_visita.not_in(ids_extras_list))

    visitas_normais = query.count()

    # 3. Calcula valor_base conforme tipo de pagamento
    pagamentos = db.query(ContratoPagamento).filter(
        ContratoPagamento.id_contrato == id_contrato
    ).all()

    valor_base = Decimal('0.00')
    for pagamento in pagamentos:
        tipo = pagamento.tipo_pagamento.tipo.lower()
        if tipo == "mensal":
            valor_base += pagamento.valor
        elif tipo == "por visita":
            valor_base += pagamento.valor * visitas_normais
        elif tipo == "por projeto":
            pass

    return valor_base, visitas_normais


def calcular_valor_extra(db: Session, id_contrato: int, mes_ano: date) -> tuple[Decimal, int]:
    """
    Retorna (valor_extra, quantidade_visitas_extras).
    Busca o valor unitário por visita e multiplica pelas visitas extras do mês.
    """
    inicio, fim = _get_intervalo_mes(mes_ano)

    # Conta visitas extras do contrato no mês
    qtd_extras = db.query(VisitaExtra).join(Visita).filter(
        Visita.id_contrato == id_contrato,
        Visita.data_hora >= inicio,
        Visita.data_hora <= fim
    ).count()

    if qtd_extras == 0:
        return Decimal('0.00'), 0

    # Busca o valor unitário por visita do contrato
    pagamento_visita = db.query(ContratoPagamento).join(
        TipoPagamento, ContratoPagamento.id_tipo_pagamento == TipoPagamento.id_tipo
    ).filter(
        ContratoPagamento.id_contrato == id_contrato,
        TipoPagamento.tipo.ilike("por visita")
    ).first()

    if not pagamento_visita:
        # Contrato não tem tipo "por visita" — extras não geram cobrança
        return Decimal('0.00'), qtd_extras

    valor_extra = pagamento_visita.valor * qtd_extras
    return valor_extra, qtd_extras