// src/mappers/contratoPagamento.mapper.ts

import { ContratoPagamentos as Mock } from '@/lib/mocks'
import type { ContratoPagamento } from '@/domain/contratoPagamento'
import type { ContratoPagamentoRaw } from '@/types/contratoPagamento.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getContratoPagamentos(): ContratoPagamento[] {
  return (Mock as ContratoPagamentoRaw[]).map(mapPagamento)
}

function mapPagamento(raw: ContratoPagamentoRaw): ContratoPagamento {
  validateShape<ContratoPagamentoRaw>('ContratoPagamentoRaw', raw, [
    'id',
    'id_contrato',
    'id_tipo_pagamento',
    'valor'
  ])

  return {
    id: String(raw.id),
    contratoId: String(raw.id_contrato),
    tipoPagamentoId: String(raw.id_tipo_pagamento),
    valor: parseFloat(raw.valor)
  }
}
