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
    ...processDescription(raw.descricao),

    data_inicio: raw.data_inicio,
    data_fim_prevista: raw.data_fim_prevista ?? undefined,
    data_fim_real: raw.data_fim_real ?? undefined,

    valor_total: parseDecimal(raw.valor_total || '0'),

    status: normalizeStatus(raw.status || 'planejado'),
    atrasado: !!raw.atrasado,

    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}

function processDescription(desc: string | null | undefined): { descricao?: string; isExtra?: boolean } {
  if (!desc) return {}
  
  const prefix = "PROJETO EXTRA"
  if (desc.toUpperCase().includes(prefix)) {
    // Remove o prefixo e o possível solicitante mencionado para deixar a descrição limpa
    // Formato esperado: "PROJETO EXTRA solicitado por XXX. Descrição real..."
    const cleaned = desc.replace(new RegExp(prefix, "gi"), "").replace(/solicitado por.*?\.\s*/i, "").trim()
    return {
      descricao: cleaned || undefined,
      isExtra: true
    }
  }
  
  return { descricao: desc }
}

function normalizeStatus(status: string): StatusProjeto {
  const s = String(status || '').toLowerCase().trim()
  
  // Mapeamento resiliente para o Domain (Preservando espaços e acentos do Banco)
  if (s === 'em andamento' || s === 'em_andamento') return 'em andamento'
  if (s === 'concluído' || s === 'concluido') return 'concluído'
  if (s === 'cancelado') return 'cancelado'
  
  console.warn('[MAPPER][PROJETO] Status desconhecido:', status)
  return 'em andamento' // Default resiliente
}

function parseDecimal(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  return isNaN(n) ? 0 : n
}
