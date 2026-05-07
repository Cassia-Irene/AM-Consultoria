import { Projetos as Mock } from '@/lib/mocks'
import type { Projeto, StatusProjeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getProjetos(): Projeto[] {
  return (Mock as unknown as ProjetoRaw[]).map(mapProjeto)
}

export function mapProjeto(raw: ProjetoRaw): Projeto {
  const idResolved = raw.id_projeto ?? raw.id
  const contratoIdResolved = raw.id_contrato ?? raw.contratoId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Projeto:ID_MISSING', raw)
    throw new Error('[MAPPER][PROJETO] Campo obrigatório ausente: id_projeto/id')
  }
  if (!contratoIdResolved) {
    warnInvalidShape('Projeto:CONTRATO_ID_MISSING', raw)
    throw new Error('[MAPPER][PROJETO] Campo obrigatório ausente: id_contrato/contratoId')
  }
  if (!raw.titulo) {
    warnInvalidShape('Projeto:TITULO_MISSING', raw)
    throw new Error('[MAPPER][PROJETO] Campo obrigatório ausente: titulo')
  }

  validateShape<ProjetoRaw>('ProjetoRaw', raw, [
    'data_inicio',
    'valor_total',
    'status'
  ])

  return {
    id: String(idResolved),
    contratoId: String(contratoIdResolved),

    titulo: raw.titulo,
    descricao: raw.descricao ?? undefined,

    data_inicio: raw.data_inicio || new Date().toISOString().split('T')[0],
    data_fim_prevista: raw.data_fim_prevista ?? undefined,
    data_fim_real: raw.data_fim_real ?? undefined,

    valor_total: parseDecimal(raw.valor_total || '0'),

    status: normalizeStatus(raw.status || 'planejado'),

    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}

function normalizeStatus(status: string): StatusProjeto {
  const s = String(status || '').toLowerCase()
  if (s === 'planejado') return 'planejado'
  if (s === 'em_andamento') return 'em_andamento'
  if (s === 'concluido') return 'concluido'
  if (s === 'cancelado') return 'cancelado'
  
  console.warn('[MAPPER][PROJETO] Status desconhecido:', status)
  return 'planejado'
}

function parseDecimal(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  return isNaN(n) ? 0 : n
}
