import { ProjetoParcelas as Mock } from '@/lib/mocks'
import type { ProjetoParcela } from '@/domain/projetoParcela'
import type { ProjetoParcelaRaw } from '@/types/projetoParcela.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getProjetoParcelas(): ProjetoParcela[] {
  return (Mock as ProjetoParcelaRaw[]).map(mapParcela)
}

export function mapParcela(raw: ProjetoParcelaRaw): ProjetoParcela {
  validateShape<ProjetoParcelaRaw>('ProjetoParcelaRaw', raw, [
    'id_parcela',
    'id_projeto',
    'numero_parcela',
    'valor_parcela',
    'data_pagamento_prevista',
    'pago'
  ])

  return {
    id: String(raw.id_parcela),
    projetoId: String(raw.id_projeto),

    numero_parcela: raw.numero_parcela,
    valor_parcela: parseDecimal(raw.valor_parcela, raw.id_parcela),

    data_pagamento_prevista: raw.data_pagamento_prevista,
    data_pagamento: raw.data_pagamento ?? undefined,

    pago: raw.pago,
  }
}

function parseDecimal(value: string, id: number): number {
  const n = parseFloat(value)
  if (isNaN(n)) {
    throw new Error(`ProjetoParcelaRaw (ID: ${id}) invalid decimal`)
  }
  return n
}
