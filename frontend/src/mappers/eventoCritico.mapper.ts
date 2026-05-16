import type { EventoCritico } from '@/domain/eventoCritico'
import type { EventoCriticoRaw } from '@/types/eventoCritico.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function mapEventoCritico(raw: EventoCriticoRaw): EventoCritico {
  const idResolved = raw.id_evento

  if (!idResolved) {
    warnInvalidShape('EventoCritico:ID_MISSING', raw)
    throw new Error('[MAPPER][EVENTO] Campo obrigatório ausente: id_evento/id')
  }

  validateShape<EventoCriticoRaw>('EventoCriticoRaw', raw, [
    'data_evento',
    'descricao'
  ])

  return {
    id: String(idResolved),
    contratoId: String(raw.id_contrato || ''),
    visitaId: raw.id_visita ? String(raw.id_visita) : undefined,
    data_evento: raw.data_evento,
    descricao: raw.descricao,
    acao_tomada: raw.acao_tomada || undefined
  }
}
