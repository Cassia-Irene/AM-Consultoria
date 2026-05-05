// src/types/faturamento.raw.ts
//
// Shape do JSON que a API retornará de GET /faturamento-cliente
// Espelha exatamente a tabela faturamento_cliente no banco

export interface FaturamentoRaw {
  id_faturamento: number
  id_contrato: number

  mes_ano: string

  visitas_realizadas: number | null

  valor_base: string
  valor_extra: string
  desconto: string
  valor_total: string

  pago: boolean
  data_pagamento: string | null
}
