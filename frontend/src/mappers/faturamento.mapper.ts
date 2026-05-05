// src/mappers/faturamento.mapper.ts
//
// Converte FaturamentoRaw (shape da API) → FaturamentoCliente (domain).

import { Faturamentos as FaturamentosMock } from '@/lib/mocks'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getFaturamentos(): FaturamentoCliente[] {
  return (FaturamentosMock as unknown as FaturamentoRaw[]).map(mapFaturamento)
}

export function mapFaturamento(raw: FaturamentoRaw): FaturamentoCliente {
  validateShape<FaturamentoRaw>('FaturamentoRaw', raw, [
    'id_faturamento',
    'id_contrato',
    'mes_ano',
    'valor_total',
    'pago'
  ])

  if (!raw.id_faturamento) throw new Error('FaturamentoRaw missing required field: id_faturamento')
  if (!raw.id_contrato) throw new Error(`FaturamentoRaw missing required field: id_contrato`)
  if (!raw.mes_ano) throw new Error(`FaturamentoRaw (ID: ${raw.id_faturamento}) missing required field: mes_ano`)

  return {
    id: String(raw.id_faturamento),
    contratoId: String(raw.id_contrato),

    mes_ano: raw.mes_ano,

    visitas_realizadas: raw.visitas_realizadas ?? undefined,

    valor_base: parseDecimal(raw.valor_base, 'valor_base', raw.id_faturamento),
    valor_extra: parseDecimal(raw.valor_extra, 'valor_extra', raw.id_faturamento),
    desconto: parseDecimal(raw.desconto, 'desconto', raw.id_faturamento),
    valor_total: parseDecimal(raw.valor_total, 'valor_total', raw.id_faturamento),

    pago: raw.pago,
    data_pagamento: raw.data_pagamento ?? undefined,
  }
}

/* ───────── helpers ───────── */

function parseDecimal(value: string | number, field: string, id: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(n)) {
    throw new Error(`FaturamentoRaw (ID: ${id}) invalid decimal for field "${field}": "${value}"`)
  }
  return n
}
