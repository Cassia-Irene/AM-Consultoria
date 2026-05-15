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
