import type { Projeto, StatusProjeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'
import { IntegrationError } from '@/utils/errors'

export function mapProjeto(raw: ProjetoRaw): Projeto {
  // Validação Estrita (Back-First)
  if (!raw.id_projeto) {
    warnInvalidShape('Projeto:ID_MISSING', raw)
    throw new IntegrationError('Projeto', 'id_projeto ausente no contrato real', raw)
  }
  if (!raw.id_contrato) {
    warnInvalidShape('Projeto:CONTRATO_ID_MISSING', raw)
    throw new IntegrationError('Projeto', 'id_contrato ausente no contrato real', raw)
  }
  if (!raw.titulo) {
    warnInvalidShape('Projeto:TITULO_MISSING', raw)
    throw new IntegrationError('Projeto', 'titulo ausente no contrato real', raw)
  }

  validateShape<ProjetoRaw>('ProjetoRead', raw, [
    'id_projeto',
    'id_contrato',
    'titulo',
    'data_inicio',
    'valor_total',
    'status'
  ])

  return {
    id: String(raw.id_projeto),
    contratoId: String(raw.id_contrato),

    titulo: raw.titulo,
    descricao: raw.descricao ?? undefined,

    data_inicio: raw.data_inicio,
    data_fim_prevista: raw.data_fim_prevista ?? undefined,
    data_fim_real: raw.data_fim_real ?? undefined,

    valor_total: parseDecimal(raw.valor_total || '0'),

    status: normalizeStatus(raw.status || 'planejado'),

    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}

function normalizeStatus(status: string): StatusProjeto {
  const s = String(status || '').toLowerCase()
  
  // Normalização SQL -> Domain
  if (s === 'em andamento' || s === 'em_andamento') return 'em_andamento'
  if (s === 'concluído' || s === 'concluido') return 'concluido'
  if (s === 'cancelado') return 'cancelado'
  if (s === 'planejado') return 'planejado'
  
  console.warn('[MAPPER][PROJETO] Status desconhecido:', status)
  return 'em_andamento' // Default resiliente
}

function parseDecimal(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  return isNaN(n) ? 0 : n
}
