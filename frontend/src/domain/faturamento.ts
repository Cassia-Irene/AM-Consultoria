// src/domain/faturamento.ts
//
// Entidade separada — reflete a tabela `faturamento_cliente` do banco.
// NÃO embutir dentro de Contrato. NÃO duplicar aqui dados que já estão em Contrato.
//
// Chave de lookup: contratoId + mes_referencia

export type StatusFaturamento = 'pendente' | 'pago' | 'atrasado'

export type FaturamentoCliente = {
  id: string               // id_faturamento (PK)
  clienteId: string        // id_cliente (FK)
  contratoId: string       // id_contrato (FK)

  mes_referencia: string   // Período de competência — formato "YYYY-MM" ex: "2026-05"

  valor_base: number           // Espelha contrato.valor_mensal no momento da geração
  valor_visitas_extra: number  // Soma de visitas extras realizadas no mês
  valor_total: number          // valor_base + valor_visitas_extra

  status: StatusFaturamento

  data_vencimento: string  // ISO 8601: YYYY-MM-DD
  data_pagamento?: string  // ISO 8601 — undefined/null = não pago ainda
}

// ─── Utilitário de lookup ──────────────────────────────────────────────────────

/**
 * Retorna o faturamento de um contrato em um mês específico.
 * Uso: `getFaturamentoDoMes(faturamentos, contrato.id, '2026-05')`
 */
export function getFaturamentoDoMes(
  faturamentos: FaturamentoCliente[],
  contratoId: string,
  mes_referencia: string
): FaturamentoCliente | undefined {
  return faturamentos.find(
    f => f.contratoId === contratoId && f.mes_referencia === mes_referencia
  )
}

/**
 * Retorna o faturamento mais recente de um contrato.
 * Usado quando não se sabe o mês exato (ex: dashboard mostrando "mês atual").
 */
export function getFaturamentoMaisRecente(
  faturamentos: FaturamentoCliente[],
  contratoId: string
): FaturamentoCliente | undefined {
  return faturamentos
    .filter(f => f.contratoId === contratoId)
    .sort((a, b) => b.mes_referencia.localeCompare(a.mes_referencia))[0]
}
