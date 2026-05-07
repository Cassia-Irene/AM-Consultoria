// src/domain/faturamento.ts
//
// Entidade separada — reflete a tabela `faturamento_cliente` do banco.
// Registro financeiro puro. Status é derivado no frontend.

export type FaturamentoCliente = {
  id: string               // id_faturamento (PK)
  contratoId: string       // id_contrato (FK)

  mes_ano: string          // Período — formato "YYYY-MM"

  visitas_realizadas?: number

  valor_base: number
  valor_extra: number      // valor_visitas_extra no modelo antigo
  desconto: number
  valor_total: number

  pago: boolean
  data_pagamento?: string  // ISO 8601 — undefined/null = não pago ainda
}

/**
 * Retorna o status visual do faturamento baseado na flag 'pago' e data de referência.
 */
export function getStatusFaturamento(f: FaturamentoCliente): 'pago' | 'pendente' | 'atrasado' {
  if (f.pago) return 'pago'

  const hoje = new Date()
  // Define o dia 10 do mês de referência como vencimento padrão fictício para cálculo de 'atrasado'
  const [ano, mes] = f.mes_ano.split('-').map(Number)
  const vencimento = new Date(ano, mes - 1, 10)

  if (vencimento < hoje) return 'atrasado'
  return 'pendente'
}

// ─── Utilitários de lookup ──────────────────────────────────────────────────────

export function getFaturamentoDoMes(
  faturamentos: FaturamentoCliente[],
  contratoId: string,
  mes_ano: string
): FaturamentoCliente | undefined {
  return faturamentos.find(
    f => f.contratoId === contratoId && f.mes_ano === mes_ano
  )
}

export function getFaturamentoMaisRecente(
  faturamentos: FaturamentoCliente[],
  contratoId: string
): FaturamentoCliente | undefined {
  return faturamentos
    .filter(f => f.contratoId === contratoId)
    .sort((a, b) => b.mes_ano.localeCompare(a.mes_ano))[0]
}
