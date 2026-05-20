import { ProjetoParcelas as Mock } from '@/lib/mocks'
import type { ProjetoParcela } from '@/domain/projetoParcela'
import type { ProjetoParcelaRaw } from '@/types/projetoParcela.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getProjetoParcelas(): ProjetoParcela[] {
  return (Mock as unknown as ProjetoParcelaRaw[]).map(mapParcela)
}

export function mapParcela(raw: ProjetoParcelaRaw): ProjetoParcela {
  const idResolved = raw.id_parcela ?? raw.id
  const projetoIdResolved = raw.id_projeto ?? raw.projetoId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Parcela:ID_MISSING', raw)
    throw new Error('[MAPPER][PARCELA] Campo obrigatório ausente: id_parcela/id')
  }
  if (!projetoIdResolved) {
    warnInvalidShape('Parcela:PROJETO_ID_MISSING', raw)
    throw new Error('[MAPPER][PARCELA] Campo obrigatório ausente: id_projeto/projetoId')
  }

  validateShape<ProjetoParcelaRaw>('ProjetoParcelaRaw', raw, [
    'numero_parcela',
    'valor_parcela',
    'data_pagamento_prevista'
  ])

  return {
    id: String(idResolved),
    projetoId: String(projetoIdResolved),

    numero_parcela: raw.numero_parcela || 0,
    valor_parcela: parseDecimal(raw.valor_parcela || '0'),

    data_pagamento_prevista: raw.data_pagamento_prevista || new Date().toISOString(),
    data_pagamento: raw.data_pagamento ?? undefined,

    pago: !!raw.pago,
  }
}

function parseDecimal(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  return isNaN(n) ? 0 : n
}
