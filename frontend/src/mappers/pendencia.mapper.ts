import { Pendencias as Mock } from '@/lib/mocks'
import type { Pendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getPendencias(): Pendencia[] {
  return (Mock as unknown as PendenciaRaw[]).map(mapPendencia)
}

export function mapPendencia(raw: PendenciaRaw): Pendencia {
  const idResolved = raw.id_pendencia ?? raw.id
  const contratoIdResolved = raw.id_contrato ?? raw.contratoId

  if (!idResolved) {
    warnInvalidShape('Pendencia:ID_MISSING', raw)
    throw new Error('[MAPPER][PENDENCIA] Campo obrigatório ausente: id_pendencia/id')
  }
  if (!contratoIdResolved) {
    warnInvalidShape('Pendencia:CONTRATO_ID_MISSING', raw)
    throw new Error('[MAPPER][PENDENCIA] Campo obrigatório ausente: id_contrato/contratoId')
  }

  validateShape<PendenciaRaw>('PendenciaRaw', raw, [
    'descricao',
    'resolvida'
  ])

  return {
    id: String(idResolved),
    contratoId: String(contratoIdResolved),
    visitaId: raw.id_visita ? String(raw.id_visita) : undefined,
    
    descricao: raw.descricao,
    resolvida: !!raw.resolvida,
    
    data_origem: raw.data_origem || new Date().toISOString(),
    data_resolucao: raw.data_resolucao ?? undefined,
    responsavel: raw.responsavel ?? undefined,
    data_prazo: raw.data_prazo ?? undefined,

    // Inteligência vinda do Backend (Backend Semântico)
    score_prioridade: raw.score_prioridade,
    urgencia_label: raw.urgencia_label,
    dias_atraso: raw.dias_atraso,
  }
}