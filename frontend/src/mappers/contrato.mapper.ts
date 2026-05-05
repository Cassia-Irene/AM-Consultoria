// src/mappers/contrato.mapper.ts
//
// Converte ContratoRaw (shape da API) → Contrato (domain).
// SEM fallbacks silenciosos. SEM campos inventados.
// Campos obrigatórios ausentes = erro explícito.

import { Contratos as ContratosMock } from '@/lib/mocks'
import type { Contrato, StatusContrato } from '@/domain/contrato'
import type { ContratoRaw } from '@/types/contrato.raw'

export function getContratos(): Contrato[] {
  return (ContratosMock as unknown as ContratoRaw[]).map(mapContrato)
}

export function mapContrato(raw: ContratoRaw): Contrato {
  // Validação de campos obrigatórios — falha explícita, sem fallback
  if (!raw.id_contrato) throw new Error(`ContratoRaw missing required field: id_contrato`)
  if (!raw.id_cliente) throw new Error(`ContratoRaw missing required field: id_cliente`)
  if (!raw.tipo_cobranca) throw new Error(`ContratoRaw (ID: ${raw.id_contrato}) missing required field: tipo_cobranca`)
  if (!raw.data_inicio) throw new Error(`ContratoRaw (ID: ${raw.id_contrato}) missing required field: data_inicio`)

  const status = normalizeStatusContrato(raw.status, raw.id_contrato)

  return {
    id: String(raw.id_contrato),
    clienteId: String(raw.id_cliente),

    tipo_cobranca: raw.tipo_cobranca,
    valor_mensal: parseDecimal(raw.valor_mensal, 'valor_mensal', raw.id_contrato),
    visitas_previstas_mes: raw.visitas_previstas_mes,
    valor_visita_extra: raw.valor_visita_extra != null
      ? parseDecimal(raw.valor_visita_extra, 'valor_visita_extra', raw.id_contrato)
      : undefined,

    inclui_relatorio: raw.inclui_relatorio,

    data_inicio: raw.data_inicio,
    data_fim: raw.data_fim ?? undefined,

    status,

    motivo_alteracao: raw.motivo_alteracao ?? undefined,
    observacoes: raw.observacoes ?? undefined,
  }
}

/* ───────── helpers ───────── */

function normalizeStatusContrato(
  status: string | undefined,
  id: number
): StatusContrato {
  if (status === 'ativo') return 'ativo'
  if (status === 'inativo') return 'inativo'
  if (status === 'suspenso') return 'suspenso'

  throw new Error(`ContratoRaw (ID: ${id}) has unknown status: "${status}"`)
}

/**
 * FastAPI serializa Decimal como string — converte para number.
 * Lança erro se o valor não for parseável.
 */
function parseDecimal(value: string | number, field: string, id: number): number {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(n)) {
    throw new Error(`ContratoRaw (ID: ${id}) invalid decimal for field "${field}": "${value}"`)
  }
  return n
}