import { Pendencias as Mock } from '@/mocks/pendencias'
import type { Pendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getPendencias(): Pendencia[] {
  return (Mock as unknown as PendenciaRaw[]).map(mapPendencia)
}

export function mapPendencia(raw: PendenciaRaw): Pendencia {
  validateShape<PendenciaRaw>('PendenciaRaw', raw, [
    'id_pendencia',
    'id_contrato',
    'id_visita',
    'descricao',
    'responsavel',
    'data_origem',
    'data_prazo',
    'resolvida',
    'data_resolucao'
  ])

  return {
    id: String(raw.id_pendencia),
    contratoId: String(raw.id_contrato),
    visitaId: raw.id_visita != null ? String(raw.id_visita) : undefined,
    descricao: raw.descricao,
    responsavel: raw.responsavel,
    data_origem: raw.data_origem,
    data_prazo: raw.data_prazo ?? undefined,
    resolvida: raw.resolvida,
    data_resolucao: raw.data_resolucao ?? undefined,
  }
}