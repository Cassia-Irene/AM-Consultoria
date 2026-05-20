import type { Visita, StatusVisita, TipoVisita, ModalidadeVisita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'
import { IntegrationError } from '@/utils/errors'


export function mapVisita(raw: VisitaRaw): Visita {
  // Validação Estrita (Back-First)
  if (!raw.id_visita) {
    warnInvalidShape('Visita:ID_MISSING', raw)
    throw new IntegrationError('Visita', 'id_visita ausente no contrato real', raw)
  }
  if (!raw.id_contrato) {
    warnInvalidShape('Visita:CONTRATO_ID_MISSING', raw)
    throw new IntegrationError('Visita', 'id_contrato ausente no contrato real', raw)
  }

  validateShape<VisitaRaw>('VisitaRaw', raw, [
    'status',
    'data_hora',
    'tipo_visita',
    'modalidade',
    'descricao'
  ])

  return {
    id: String(raw.id_visita),
    contratoId: String(raw.id_contrato),
    projetoId: raw.id_projeto ? String(raw.id_projeto) : undefined,

    status: normalizeStatus(raw.status || 'agendada'),
    data_hora: raw.data_hora || new Date().toISOString(),
    duracao_minutos: raw.duracao_minutos ?? undefined,

    tipo_visita: (raw.tipo_visita || 'rotineira') as TipoVisita,
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
  return 'agendada'
}

function normalizeModalidade(value: string): ModalidadeVisita {
  const v = String(value || '').toLowerCase()
  if (v === 'remota' || v === 'remoto' || v === 'online') return 'remota'
  return 'presencial'
}