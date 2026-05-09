// src/mappers/tipoPagamento.mapper.ts

import { TiposPagamento as Mock } from '@/lib/mocks'
import type { TipoPagamento } from '@/domain/tipoPagamento'
import type { TipoPagamentoRaw } from '@/types/tipoPagamento.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getTiposPagamento(): TipoPagamento[] {
  return (Mock as TipoPagamentoRaw[]).map(mapTipo)
}

function mapTipo(raw: TipoPagamentoRaw): TipoPagamento {
  const idResolved = raw.id_tipo ?? raw.id

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('TipoPagamento:ID_MISSING', raw)
    throw new Error('[MAPPER][TIPO_PAGAMENTO] Campo obrigatório ausente: id_tipo/id')
  }

  // Validação Importante
  if (!raw.tipo) {
    warnInvalidShape('TipoPagamento:TIPO_MISSING', raw, 'Usando fallback: "Tipo não informado"')
  }

  return {
    id: String(idResolved),
    tipo: raw.tipo || 'Tipo não informado'
  }
}
