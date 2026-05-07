// src/mappers/visita.mapper.ts

import { Visitas as VisitasMock } from '@/lib/mocks'
import type { Visita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'

export function getVisitas(): Visita[] {
  return (VisitasMock as VisitaRaw[]).map(mapVisita)
}

export function mapVisita(raw: VisitaRaw): Visita {
  // Tenta construir dataHora combinando data e horario
  let dataHora = raw.data
  if (raw.horario && raw.horario !== '—') {
    // Se horario for "HH:mm", adiciona T e concatena
    dataHora = `${raw.data}T${raw.horario}:00`
  } else if (!dataHora.includes('T')) {
    dataHora = `${raw.data}T00:00:00`
  }

  if (!raw.clienteId) throw new Error(`VisitaRaw (ID: ${raw.id}) missing required field: clienteId`)
  if (!raw.contratoId) throw new Error(`VisitaRaw (ID: ${raw.id}) missing required field: contratoId`)

  return {
    id: String(raw.id),
    clienteId: String(raw.clienteId),
    contratoId: String(raw.contratoId),

    data_visita: dataHora,
    duracao_estimada_minutos: raw.duracaoMinutos,

    tipo: normalizeTipo(raw.tipo),
    modalidade: raw.modalidade || 'presencial',
    status: raw.status || 'Agendada',

    descricao: raw.descricao || '',
    resultado: raw.resultados || '',

    criadaEm: new Date().toISOString(),
    observacoes: raw.observacoes,
    ultimaVisitaEm: raw.ultimaVisitaEm,
  }
}

/* ───────── helpers ───────── */

function normalizeTipo(tipo?: string): 'rotina' | 'extra' {
  if (tipo === 'rotina') return 'rotina'
  if (tipo === 'extra') return 'extra'

  console.warn('Tipo de visita desconhecido:', tipo)
  return 'rotina'
}