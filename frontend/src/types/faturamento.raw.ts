// src/types/faturamento.raw.ts
//
// Shape do JSON que a API retornará de GET /faturamento-cliente
// Espelha a futura tabela faturamento_cliente no banco

export interface FaturamentoRaw {
  id_faturamento: string | number
  id_cliente: number
  id_contrato: number

  mes_referencia: string      // "YYYY-MM"

  valor_base: string          // Decimal vem como string do FastAPI
  valor_visitas_extra: string // Decimal
  valor_total: string         // Decimal

  status: string              // 'pendente' | 'pago' | 'atrasado'

  data_vencimento: string     // ISO 8601: "YYYY-MM-DD"
  data_pagamento: string | null
}
