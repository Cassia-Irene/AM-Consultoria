import { Visitas as Mock } from '@/lib/mocks'
import type { Visita, StatusVisita, TipoVisita, ModalidadeVisita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getVisitas(): Visita[] {
  return (Mock as unknown as VisitaRaw[]).map(mapVisita)
}

export function mapVisita(raw: VisitaRaw): Visita {
  validateShape<VisitaRaw>('VisitaRaw', raw, [
    'id_visita',
    'id_contrato',
    'status',
    'data_hora',
    'tipo_visita',
    'modalidade',
    'descricao'
  ])

  return {
    id: String(raw.id_visita),

    contratoId: String(raw.id_contrato),
    projetoId: raw.id_projeto != null
      ? String(raw.id_projeto)
      : undefined,

    status: normalizeStatus(raw.status, raw.id_visita),

    data_hora: raw.data_hora,

    duracao_minutos: raw.duracao_minutos ?? undefined,

    tipo_visita: normalizeTipo(raw.tipo_visita, raw.id_visita),
    modalidade: normalizeModalidade(raw.modalidade, raw.id_visita),

    descricao: raw.descricao,
    resultados: raw.resultados ?? undefined,
  }
}

function normalizeStatus(value: string, id: number): StatusVisita {
  const v = value.toLowerCase()
  if (v === 'agendada' || v === 'realizada' || v === 'cancelada') {
    return v as StatusVisita
  }
  throw new Error(`VisitaRaw (ID: ${id}) invalid status: ${value}`)
}

function normalizeTipo(value: string, id: number): TipoVisita {
  const v = value.toLowerCase()
  if (v === 'rotina' || v === 'extra' || v === 'projeto') {
    return v as TipoVisita
  }
  throw new Error(`VisitaRaw (ID: ${id}) invalid tipo_visita: ${value}`)
}

function normalizeModalidade(value: string, id: number): ModalidadeVisita {
  const v = value.toLowerCase()
  if (v === 'presencial' || v === 'online' || v === 'hibrida') {
    return v as ModalidadeVisita
  }
  throw new Error(`VisitaRaw (ID: ${id}) invalid modalidade: ${value}`)
}