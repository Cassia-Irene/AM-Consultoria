// src/mappers/contratoPagamento.mapper.ts

import { ContratoPagamentos as Mock } from '@/lib/mocks'
import type { ContratoPagamento } from '@/domain/contratoPagamento'
import type { ContratoPagamentoRaw } from '@/types/contratoPagamento.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getContratoPagamentos(): ContratoPagamento[] {
  return (Mock as ContratoPagamentoRaw[]).map(mapPagamento)
}

function mapPagamento(raw: ContratoPagamentoRaw): ContratoPagamento {
  const idResolved = raw.id
  const contratoIdResolved = raw.id_contrato ?? raw.contratoId
  const tipoPagamentoIdResolved = raw.id_tipo_pagamento ?? raw.tipoPagamentoId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('ContratoPagamento:ID_MISSING', raw)
    throw new Error('[MAPPER][PAGAMENTO] Campo obrigatório ausente: id')
  }
  if (!contratoIdResolved) {
    warnInvalidShape('ContratoPagamento:CONTRATO_ID_MISSING', raw)
    throw new Error('[MAPPER][PAGAMENTO] Campo obrigatório ausente: id_contrato/contratoId')
  }
  if (!tipoPagamentoIdResolved) {
    warnInvalidShape('ContratoPagamento:TIPO_PAGAMENTO_ID_MISSING', raw)
    throw new Error('[MAPPER][PAGAMENTO] Campo obrigatório ausente: id_tipo_pagamento/tipoPagamentoId')
  }

  validateShape<ContratoPagamentoRaw>('ContratoPagamentoRaw', raw, [
    'valor'
  ])

  return {
    id: String(idResolved),
    contratoId: String(contratoIdResolved),
    tipoPagamentoId: String(tipoPagamentoIdResolved),
    valor: parseDecimal(raw.valor || '0', 'valor', String(idResolved))
  }
}

function parseDecimal(value: string | number, field: string, id: string): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  if (isNaN(n)) {
    console.warn(`[MAPPER][PAGAMENTO] (ID: ${id}) Decimal inválido para "${field}": "${value}". Usando 0.`)
    return 0
  }
  return n
}
