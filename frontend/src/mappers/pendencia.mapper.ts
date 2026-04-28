// src/mappers/pendencia.mapper.ts

import { Pendencias as PendenciasMock } from '@/lib/mocks'
import type { Pendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'

export function getPendencias(): Pendencia[] {
  return (PendenciasMock as PendenciaRaw[]).map(mapPendencia)
}

export function mapPendencia(raw: PendenciaRaw): Pendencia {
  return {
    id: String(raw.id),
    titulo: raw.titulo,

    clienteId: String(raw.clienteId),

    status: normalizeStatus(raw.status),

    prazo: raw.prazo ?? undefined,

    criadaEm: raw.criadaEm,

    origem: raw.origemTipo
      ? {
          tipo: normalizeOrigemTipo(raw.origemTipo),
          descricao: raw.origemDescricao || '',
        }
      : undefined,
  }
}

/* ───────── helpers ───────── */

function normalizeStatus(
  status: string
): 'aberta' | 'concluida' {
  if (status === 'aberta') return 'aberta'
  if (status === 'concluida') return 'concluida'

  console.warn('Status de pendência desconhecido:', status)
  return 'aberta'
}

function normalizeOrigemTipo(
  tipo: string
): 'visita' | 'contrato' | 'manual' {
  if (tipo === 'visita') return 'visita'
  if (tipo === 'contrato') return 'contrato'
  if (tipo === 'manual') return 'manual'

  console.warn('Origem desconhecida:', tipo)
  return 'manual'
}