export interface ProjetoParcelaRaw {
  id_parcela: number
  id_projeto: number

  // Aliases para compatibilidade híbrida
  id?: number | string
  projetoId?: number | string

  numero_parcela: number
  valor_parcela: string

  data_pagamento_prevista: string
  data_pagamento: string | null

  pago: boolean
}
