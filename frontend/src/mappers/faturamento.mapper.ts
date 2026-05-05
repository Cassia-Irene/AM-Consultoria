// src/mappers/faturamento.mapper.ts
//
// Converte FaturamentoRaw (shape da API) → FaturamentoCliente (domain).
// Fonte temporária: mocks/faturamentos.ts
// Fonte futura: GET /faturamento-cliente

import { Faturamentos as FaturamentosMock } from '@/lib/mocks'
import type { FaturamentoCliente, StatusFaturamento } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getFaturamentos(): FaturamentoCliente[] {
  return (FaturamentosMock as unknown as FaturamentoRaw[]).map(mapFaturamento)
}

export function mapFaturamento(raw: FaturamentoRaw): FaturamentoCliente {
  validateShape<FaturamentoRaw>('FaturamentoRaw', raw, [
    'id_faturamento',
    'id_cliente',
    'id_contrato',
    'mes_referencia',
    'valor_total',
    'status'
  ])

  if (!raw.id_faturamento) throw new Error('FaturamentoRaw missing required field: id_faturamento')
  if (!raw.id_cliente) throw new Error(`FaturamentoRaw missing required field: id_cliente`)
  if (!raw.id_contrato) throw new Error(`FaturamentoRaw missing required field: id_contrato`)
  if (!raw.mes_referencia) throw new Error(`FaturamentoRaw (ID: ${raw.id_faturamento}) missing required field: mes_referencia`)
  if (!raw.data_vencimento) throw new Error(`FaturamentoRaw (ID: ${raw.id_faturamento}) missing required field: data_vencimento`)

  const status = normalizeStatusFaturamento(raw.status, raw.id_faturamento)

  return {
    id: String(raw.id_faturamento),
    clienteId: String(raw.id_cliente),
    contratoId: String(raw.id_contrato),

    mes_referencia: raw.mes_referencia,

    valor_base: parseDecimal(raw.valor_base, 'valor_base', raw.id_faturamento),
    valor_visitas_extra: parseDecimal(raw.valor_visitas_extra, 'valor_visitas_extra', raw.id_faturamento),
    valor_total: parseDecimal(raw.valor_total, 'valor_total', raw.id_faturamento),

    status,

    data_vencimento: raw.data_vencimento,
    data_pagamento: raw.data_pagamento ?? undefined,
  }
}

/* ───────── helpers ───────── */

function normalizeStatusFaturamento(
  status: string | undefined,
  id: string | number
): StatusFaturamento {
  if (status === 'pago') return 'pago'
  if (status === 'pendente') return 'pendente'
  if (status === 'atrasado') return 'atrasado'

  throw new Error(`FaturamentoRaw (ID: ${id}) has unknown status: "${status}"`)
}

function parseDecimal(value: string | number, field: string, id: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(n)) {
    throw new Error(`FaturamentoRaw (ID: ${id}) invalid decimal for field "${field}": "${value}"`)
  }
  return n
}
