// src/mappers/projeto.mapper.ts
//
// Converte ProjetoRaw (shape da API) → Projeto (domain).
// Validação estrita — sem fallback silencioso.

import { Projetos as Mock } from '@/lib/mocks'
import type { Projeto, StatusProjeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getProjetos(): Projeto[] {
  return (Mock as unknown as ProjetoRaw[]).map(mapProjeto)
}

export function mapProjeto(raw: ProjetoRaw): Projeto {
  validateShape<ProjetoRaw>('ProjetoRaw', raw, [
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

    valor_total: parseDecimal(raw.valor_total),

    status: normalizeStatus(raw.status),

    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}

function normalizeStatus(status: string): StatusProjeto {
  if (status === 'planejado') return 'planejado'
  if (status === 'em_andamento') return 'em_andamento'
  if (status === 'concluido') return 'concluido'
  if (status === 'cancelado') return 'cancelado'
  throw new Error(`[ProjetoMapper] Status inválido: "${status}"`)
}

function parseDecimal(value: string): number {
  const n = parseFloat(value)
  if (isNaN(n)) throw new Error(`[ProjetoMapper] valor_total inválido: "${value}"`)
  return n
}
