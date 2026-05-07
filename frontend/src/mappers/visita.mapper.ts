import { Visitas as Mock } from '@/lib/mocks'
import type { Visita, StatusVisita, TipoVisita, ModalidadeVisita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getVisitas(): Visita[] {
  return (Mock as unknown as VisitaRaw[]).map(mapVisita)
}

export function mapVisita(raw: VisitaRaw): Visita {
  const idResolved = raw.id_visita ?? raw.id
  const contratoIdResolved = raw.id_contrato ?? raw.contratoId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Visita:ID_MISSING', raw)
    throw new Error('[MAPPER][VISITA] Campo obrigatório ausente: id_visita/id')
  }
  if (!contratoIdResolved) {
    warnInvalidShape('Visita:CONTRATO_ID_MISSING', raw)
    throw new Error('[MAPPER][VISITA] Campo obrigatório ausente: id_contrato/contratoId')
  }

  validateShape<VisitaRaw>('VisitaRaw', raw, [
    'status',
    'data_hora',
    'tipo_visita',
    'modalidade',
    'descricao'
  ])

  return {
    id: String(idResolved),
    contratoId: String(contratoIdResolved),
    projetoId: (raw.id_projeto ?? raw.projetoId) != null
      ? String(raw.id_projeto ?? raw.projetoId)
      : undefined,

    status: normalizeStatus(raw.status || 'agendada'),
    data_hora: raw.data_hora || new Date().toISOString(),
    duracao_minutos: raw.duracao_minutos ?? undefined,

    tipo_visita: normalizeTipo(raw.tipo_visita || 'rotina'),
    modalidade: normalizeModalidade(raw.modalidade || 'presencial'),

    descricao: raw.descricao || 'Sem descrição',
    resultados: raw.resultados ?? undefined,
  }
}

function normalizeStatus(value: string): StatusVisita {
  const v = String(value || '').toLowerCase()
  if (v === 'agendada' || v === 'realizada' || v === 'cancelada') {
    return v as StatusVisita
  }
  console.warn('[MAPPER][VISITA] Status inválido:', value)
  return 'agendada'
}

function normalizeTipo(value: string): TipoVisita {
  const v = String(value || '').toLowerCase()
  if (v === 'rotina' || v === 'extra' || v === 'projeto') {
    return v as TipoVisita
  }
  console.warn('[MAPPER][VISITA] Tipo inválido:', value)
  return 'rotina'
}

function normalizeModalidade(value: string): ModalidadeVisita {
  const v = String(value || '').toLowerCase()
  if (v === 'presencial' || v === 'online' || v === 'hibrida') {
    return v as ModalidadeVisita
  }
  console.warn('[MAPPER][VISITA] Modalidade inválida:', value)
  return 'presencial'
}