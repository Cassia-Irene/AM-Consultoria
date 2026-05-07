import { Pendencias as Mock } from '@/mocks/pendencias'
import type { Pendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getPendencias(): Pendencia[] {
  return (Mock as unknown as PendenciaRaw[]).map(mapPendencia)
}

export function mapPendencia(raw: PendenciaRaw): Pendencia {
  const idResolved = raw.id_pendencia ?? raw.id
  const contratoIdResolved = raw.id_contrato ?? raw.contratoId
  
  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Pendencia:ID_MISSING', raw)
    throw new Error('[MAPPER][PENDENCIA] Campo obrigatório ausente: id_pendencia/id')
  }
  if (!contratoIdResolved) {
    warnInvalidShape('Pendencia:CONTRATO_ID_MISSING', raw)
    throw new Error('[MAPPER][PENDENCIA] Campo obrigatório ausente: id_contrato/contratoId')
  }
  if (!raw.descricao) {
    warnInvalidShape('Pendencia:DESCRICAO_MISSING', raw)
    throw new Error('[MAPPER][PENDENCIA] Campo obrigatório ausente: descricao')
  }

  validateShape<PendenciaRaw>('PendenciaRaw', raw, [
    'responsavel',
    'data_origem'
  ])

  return {
    id: String(idResolved),
    contratoId: String(contratoIdResolved),
    visitaId: (raw.id_visita ?? raw.visitaId) != null ? String(raw.id_visita ?? raw.visitaId) : undefined,
    descricao: raw.descricao,
    responsavel: raw.responsavel || 'Não definido',
    data_origem: raw.data_origem || new Date().toISOString(),
    data_prazo: raw.data_prazo ?? undefined,
    resolvida: !!raw.resolvida,
    data_resolucao: raw.data_resolucao ?? undefined,
  }
}