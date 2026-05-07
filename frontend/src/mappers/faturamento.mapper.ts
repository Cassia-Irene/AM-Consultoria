import { Faturamentos as FaturamentosMock } from '@/lib/mocks'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getFaturamentos(): FaturamentoCliente[] {
  return (FaturamentosMock as unknown as FaturamentoRaw[]).map(mapFaturamento)
}

export function mapFaturamento(raw: FaturamentoRaw): FaturamentoCliente {
  // 1. Resolução de IDs (Fatais)
  const idResolved = raw.id_faturamento ?? raw.id
  const contratoIdResolved = raw.id_contrato ?? raw.contratoId

  if (!idResolved) {
    warnInvalidShape('Faturamento:ID_MISSING', raw)
    throw new Error('[MAPPER][FATURAMENTO] Campo obrigatório ausente: id_faturamento/id')
  }
  if (!contratoIdResolved) {
    warnInvalidShape('Faturamento:CONTRATO_ID_MISSING', raw)
    throw new Error('[MAPPER][FATURAMENTO] Campo obrigatório ausente: id_contrato/contratoId')
  }

  // 2. Resolução de mes_ano (Importante, não-fatal)
  const mesAnoResolved =
    raw.mes_ano ??
    raw.mesAno ??
    raw.mesReferencia ??
    raw.competencia ??
    raw.referencia ??
    raw.data_emissao?.slice(0, 7)

  if (!mesAnoResolved) {
    warnInvalidShape('Faturamento:MES_ANO_MISSING', raw, 'Usando fallback: "desconhecido"')
  }

  // 3. Resolução de valor_base (Importante, não-fatal)
  const valorBaseRaw =
    raw.valor_base ??
    raw.valorBase ??
    raw.valor_total ??
    raw.valorTotal

  if (valorBaseRaw === undefined || valorBaseRaw === null) {
    warnInvalidShape('Faturamento:VALOR_BASE_MISSING', raw, 'Usando fallback: 0')
  }

  // 4. Resolução de pago (Importante, não-fatal)
  const pagoResolved =
    raw.pago ??
    raw.quitado ??
    (String(raw.status || '').toLowerCase() === 'pago')

  if (pagoResolved === undefined) {
    warnInvalidShape('Faturamento:PAGO_MISSING', raw, 'Usando fallback: false')
  }

  // 5. Resolução de valores opcionais (Silencioso)
  const valorExtraRaw = raw.valor_extra ?? raw.valorExtra ?? 0
  const descontoRaw = raw.desconto ?? raw.valor_desconto ?? 0

  validateShape<FaturamentoRaw>('FaturamentoRaw', raw, [
    'valor_total'
  ])

  return {
    id: String(idResolved),
    contratoId: String(contratoIdResolved),

    mes_ano: mesAnoResolved || 'desconhecido',

    visitas_realizadas: raw.visitas_realizadas ?? undefined,

    valor_base: parseDecimal(valorBaseRaw, 'valor_base', String(idResolved)),
    valor_extra: parseDecimal(valorExtraRaw, 'valor_extra', String(idResolved)),
    desconto: parseDecimal(descontoRaw, 'desconto', String(idResolved)),
    valor_total: parseDecimal(raw.valor_total ?? raw.valorTotal, 'valor_total', String(idResolved)),

    pago: !!pagoResolved,
    data_pagamento: raw.data_pagamento ?? undefined,
  }
}

/* ───────── helpers ───────── */

function parseDecimal(value: string | number | undefined | null, field: string, id: string): number {
  if (value === undefined || value === null) return 0
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  if (isNaN(n)) {
    console.warn(`[MAPPER][FATURAMENTO] (ID: ${id}) Decimal inválido para "${field}": "${value}". Usando 0.`)
    return 0
  }
  return n
}
