import { Entregas as Mock } from '@/lib/mocks'
import type { Entrega } from '@/domain/entrega'
import type { EntregaRaw } from '@/types/entrega.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getEntregas(): Entrega[] {
  return (Mock as unknown as EntregaRaw[]).map(mapEntrega)
}

export function mapEntrega(raw: EntregaRaw): Entrega {
  const idResolved = raw.id_entrega ?? raw.id
  const projetoIdResolved = raw.id_projeto ?? raw.projetoId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Entrega:ID_MISSING', raw)
    throw new Error('[MAPPER][ENTREGA] Campo obrigatório ausente: id_entrega/id')
  }
  if (!projetoIdResolved) {
    warnInvalidShape('Entrega:PROJETO_ID_MISSING', raw)
    throw new Error('[MAPPER][ENTREGA] Campo obrigatório ausente: id_projeto/projetoId')
  }

  validateShape<EntregaRaw>('EntregaRaw', raw, [
    'descricao',
    'data_entrega_prevista'
  ])

  return {
    id: String(idResolved),
    projetoId: String(projetoIdResolved),

    descricao: raw.descricao || 'Entrega sem descrição',
    data_entrega_prevista: raw.data_entrega_prevista || new Date().toISOString(),
    data_entrega_real: raw.data_entrega_real ?? undefined,

    entregue: !!raw.entregue,
    referencia_doc: raw.referencia_doc ?? undefined,
  }
}
