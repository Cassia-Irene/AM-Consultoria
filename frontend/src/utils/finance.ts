// src/utils/finance.ts

import type { Contrato } from '@/domain/contrato'
import type { Projeto } from '@/domain/projeto'
import type { FaturamentoCliente } from '@/domain/faturamento'

/**
 * Formata um número para moeda BRL.
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Calcula a receita recorrente mensal (MRR) baseada em contratos ativos.
 */
export function calcularReceitaMensal(contratos: Contrato[]): number {
  return contratos
    .filter(c => c.status === 'ativo')
    .reduce((acc, c) => acc + (c.valor_mensal || 0), 0)
}

/**
 * Calcula a receita total acumulada de projetos (excluindo cancelados).
 */
export function calcularReceitaProjetos(projetos: Projeto[]): number {
  return projetos
    .filter(p => p.status !== 'cancelado')
    .reduce((acc, p) => acc + (p.valor_total || 0), 0)
}

/**
 * Calcula o total efetivamente recebido (faturamentos marcados como pagos).
 */
export function calcularReceitaFaturada(faturamentos: FaturamentoCliente[]): number {
  return faturamentos
    .filter(f => f.pago)
    .reduce((acc, f) => acc + (f.valor_total || 0), 0)
}
