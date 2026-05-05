// src/mappers/tipoPagamento.mapper.ts

import { TiposPagamento as Mock } from '@/lib/mocks'
import type { TipoPagamento } from '@/domain/tipoPagamento'
import type { TipoPagamentoRaw } from '@/types/tipoPagamento.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getTiposPagamento(): TipoPagamento[] {
  return (Mock as TipoPagamentoRaw[]).map(mapTipo)
}

function mapTipo(raw: TipoPagamentoRaw): TipoPagamento {
  validateShape<TipoPagamentoRaw>('TipoPagamentoRaw', raw, [
    'id_tipo',
    'tipo'
  ])

  return {
    id: String(raw.id_tipo),
    tipo: raw.tipo
  }
}
