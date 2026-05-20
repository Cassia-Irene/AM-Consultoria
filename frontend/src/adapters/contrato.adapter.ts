/**
 * contrato.adapter.ts
 *
 * FONTE DE VERDADE dos DTOs de contrato.
 */


// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export interface ReplaceContratoInput {
  contratoId: string
  novoValorMensal?: number
  visitas: number
  motivo: string
}

// ─── Tipos de saída (contrato exato da API) ───────────────────────────────────

/**
 * DTO para o endpoint POST /contratos/replace
 */
export interface ContratoReplaceDTO {
  contrato_id: number
  visitas_previstas_mes: number
  novo_valor_mensal?: number
}

// ─── Conversão ────────────────────────────────────────────────────────────────

export function toReplacePayload(input: ReplaceContratoInput): ContratoReplaceDTO {
  return {
    contrato_id: Number(input.contratoId),
    visitas_previstas_mes: input.visitas,
    novo_valor_mensal: input.novoValorMensal,
  }
}

// ─── Criação (POST /contratos/) ────────────────────────────────────────────────

export interface CreateContratoInput {
  clienteId: string
  dataInicio: string
  dataFim?: string
  servicosContratados: string
  visitasPrevistasMes: number
  incluiRelatorio: boolean
  observacoesGerais?: string
  valorMensal: number
}

export interface ContratoCreateDTO {
  id_cliente: number
  data_inicio: string
  data_fim?: string | null
  servicos_contratados: string
  visitas_previstas_mes: number
  inclui_relatorio: boolean
  observacoes_gerais?: string | null
}

export function toCreatePayload(input: CreateContratoInput): ContratoCreateDTO {
  return {
    id_cliente: Number(input.clienteId),
    data_inicio: input.dataInicio,
    data_fim: input.dataFim || null,
    servicos_contratados: input.servicosContratados,
    visitas_previstas_mes: input.visitasPrevistasMes,
    inclui_relatorio: input.incluiRelatorio,
    observacoes_gerais: input.observacoesGerais || null,
  }
}

// ─── Edição Rápida (PATCH /contratos/{id}) ──────────────────────────────────────

export interface PatchContratoInput {
  contratoId: string
  servicosContratados?: string
  observacoesGerais?: string
  incluiRelatorio?: boolean
  dataFim?: string | null
}

export interface ContratoPatchDTO {
  servicos_contratados?: string
  observacoes_gerais?: string | null
  inclui_relatorio?: boolean
  data_fim?: string | null
}

export function toPatchPayload(input: PatchContratoInput): ContratoPatchDTO {
  return {
    servicos_contratados: input.servicosContratados,
    observacoes_gerais: input.observacoesGerais !== undefined ? (input.observacoesGerais || null) : undefined,
    inclui_relatorio: input.incluiRelatorio,
    data_fim: input.dataFim !== undefined ? (input.dataFim || null) : undefined
  }
}
