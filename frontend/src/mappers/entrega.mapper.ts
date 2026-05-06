import { Entregas as Mock } from '@/lib/mocks'
import type { Entrega } from '@/domain/entrega'
import type { EntregaRaw } from '@/types/entrega.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getEntregas(): Entrega[] {
  return (Mock as EntregaRaw[]).map(mapEntrega)
}

export function mapEntrega(raw: EntregaRaw): Entrega {
  validateShape<EntregaRaw>('EntregaRaw', raw, [
    'id_entrega',
    'id_projeto',
    'descricao',
    'data_entrega_prevista',
    'entregue'
  ])

  return {
    id: String(raw.id_entrega),
    projetoId: String(raw.id_projeto),

    descricao: raw.descricao,
    data_entrega_prevista: raw.data_entrega_prevista,
    data_entrega_real: raw.data_entrega_real ?? undefined,

    entregue: raw.entregue,
    referencia_doc: raw.referencia_doc ?? undefined,
  }
}
