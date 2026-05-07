// src/types/faturamento.raw.ts
//
// Shape do JSON que a API retornará de GET /faturamento-cliente
// Espelha exatamente a tabela faturamento_cliente no banco

export interface FaturamentoRaw {
  id_faturamento: number
  id_contrato: number

  // Aliases para compatibilidade híbrida
  id?: number | string
  contratoId?: number | string
  mesAno?: string
  mesReferencia?: string
  competencia?: string
  referencia?: string
  data_emissao?: string
  quitado?: boolean
  status?: string
  valorTotal?: string | number
  valorBase?: string | number
  valorExtra?: string | number
  valor_desconto?: string | number

  mes_ano?: string

  visitas_realizadas?: number | null

  valor_base?: string | number
  valor_extra?: string | number
  desconto?: string | number
  valor_total?: string | number

  pago?: boolean
  data_pagamento?: string | null
}
