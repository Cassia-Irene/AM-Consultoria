// src/types/contratoPagamento.raw.ts
//
// Shape do JSON da API para CONTRATO_PAGAMENTO.

export interface ContratoPagamentoRaw {
  id: number
  id_contrato: number
  id_tipo_pagamento: number

  // Aliases para compatibilidade híbrida
  contratoId?: number | string
  tipoPagamentoId?: number | string

  valor: string // Decimal no banco costuma vir como string no JSON
}
