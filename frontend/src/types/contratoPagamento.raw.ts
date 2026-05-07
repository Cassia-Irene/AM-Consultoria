// src/types/contratoPagamento.raw.ts
//
// Shape do JSON da API para CONTRATO_PAGAMENTO.

export interface ContratoPagamentoRaw {
  id: number
  id_contrato: number
  id_tipo_pagamento: number
  valor: string // Decimal no banco costuma vir como string no JSON
}
