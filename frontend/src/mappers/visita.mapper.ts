// src/mappers/visita.mapper.ts

import { Visitas as VisitasMock } from '@/lib/mocks'
import type { Visita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'

export function getVisitas(): Visita[] {
  return (VisitasMock as VisitaRaw[]).map(mapVisita)
}

export function mapVisita(raw: VisitaRaw): Visita {
  return {
    id: String(raw.id),
    clienteId: String(raw.clienteId),

    data: raw.data,
    criadaEm: raw.criadaEm ?? new Date().toISOString(),

    horario: raw.horario ?? '—',
    tipo: normalizeTipo(raw.tipo),

    ultimaVisitaEm: raw.ultimaVisitaEm,
    observacoes: raw.observacoes,
  }
}

/* ───────── helpers ───────── */

function normalizeTipo(tipo?: string): 'rotina' | 'extra' {
  if (tipo === 'rotina') return 'rotina'
  if (tipo === 'extra') return 'extra'

  console.warn('Tipo de visita desconhecido:', tipo)
  return 'rotina'
}