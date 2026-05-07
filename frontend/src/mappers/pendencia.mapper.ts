// src/mappers/pendencia.mapper.ts

import { Pendencias as PendenciasMock } from '@/lib/mocks'
import type { Pendencia, PrioridadePendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'

export function getPendencias(): Pendencia[] {
  return (PendenciasMock as PendenciaRaw[]).map(mapPendencia)
}

export function mapPendencia(raw: PendenciaRaw): Pendencia {
  return {
    id: String(raw.id),
    titulo: raw.titulo,

    clienteId: String(raw.clienteId),
    contratoId: raw.contratoId || 'mock-contrato',
    prioridade: normalizePrioridade(raw.prioridade),

    status: normalizeStatus(raw.status),

    prazo: raw.prazo ?? undefined,
    data_origem: raw.criadaEm,
    criadaEm: raw.criadaEm,
    atualizadaEm: raw.criadaEm,
  }
}

/* ───────── helpers ───────── */

function normalizeStatus(
  status: string
): 'aberta' | 'em_andamento' | 'concluida' {
  if (status === 'aberta') return 'aberta'
  if (status === 'em_andamento') return 'em_andamento'
  if (status === 'concluida') return 'concluida'

  console.warn('Status de pendência desconhecido:', status)
  return 'aberta'
}

function normalizePrioridade(prioridade?: string): PrioridadePendencia {
  if (prioridade === 'urgente') return 'urgente'
  if (prioridade === 'atencao') return 'atencao'
  if (prioridade === 'normal') return 'normal'

  // BACKEND_DEPENDENCY: campo prioridade não existe no modelo Pendencia
  // (pendencia.py está vazio). Quando implementado, este fallback pode ser removido.
  return 'normal'
}