// src/types/faturamento.raw.ts
//
// Shape do JSON que a API retornará de GET /faturamento-cliente
// Espelha exatamente a tabela faturamento_cliente no banco

export interface FaturamentoRaw {
  id_faturamento: number
  id_contrato: number
  
  mes_ano: string             // ISO 8601: "YYYY-MM-DD" (sempre dia 1)
  
  visitas_realizadas: number
  
  valor_base: string | number
  valor_extra: string | number
  desconto: string | number
  valor_total: string | number
  
  pago: boolean
  data_pagamento: string | null // ISO 8601: "YYYY-MM-DD"
}
