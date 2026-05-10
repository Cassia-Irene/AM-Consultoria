import type { FaturamentoCliente } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'
import { IntegrationError } from '@/utils/errors'

export function mapFaturamento(raw: FaturamentoRaw): FaturamentoCliente {
  // Validação Estrita (Back-First)
  if (!raw.id_faturamento) {
    warnInvalidShape('Faturamento:ID_MISSING', raw)
    throw new IntegrationError('Faturamento', 'id_faturamento ausente no contrato real', raw)
  }
  if (!raw.id_contrato) {
    warnInvalidShape('Faturamento:CONTRATO_ID_MISSING', raw)
    throw new IntegrationError('Faturamento', 'id_contrato ausente no contrato real', raw)
  }
  if (!raw.mes_ano) {
    warnInvalidShape('Faturamento:MES_ANO_MISSING', raw)
    throw new IntegrationError('Faturamento', 'mes_ano ausente no contrato real', raw)
  }

  validateShape<FaturamentoRaw>('FaturamentoRead', raw, [
    'id_faturamento',
    'id_contrato',
    'mes_ano',
    'valor_base',
    'valor_total',
    'pago'
  ])

  // Normalização de mes_ano (YYYY-MM-DD -> YYYY-MM) para o Domínio UI
  const mesAnoUI = raw.mes_ano.slice(0, 7)

  return {
    id: String(raw.id_faturamento),
    contratoId: String(raw.id_contrato),

    mes_ano: mesAnoUI,

    visitas_realizadas: raw.visitas_realizadas,

    valor_base: parseDecimal(raw.valor_base, 'valor_base', String(raw.id_faturamento)),
    valor_extra: parseDecimal(raw.valor_extra, 'valor_extra', String(raw.id_faturamento)),
    desconto: parseDecimal(raw.desconto, 'desconto', String(raw.id_faturamento)),
    valor_total: parseDecimal(raw.valor_total, 'valor_total', String(raw.id_faturamento)),

    pago: !!raw.pago,
    data_pagamento: raw.data_pagamento ?? undefined,
  }
}

function parseDecimal(value: string | number | undefined | null, field: string, id: string): number {
  if (value === undefined || value === null) return 0
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  if (isNaN(n)) {
    console.warn(`[MAPPER][FATURAMENTO] (ID: ${id}) Decimal inválido para "${field}": "${value}". Usando 0.`)
    return 0
  }
  return n
}
