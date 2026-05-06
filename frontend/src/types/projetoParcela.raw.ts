export interface ProjetoParcelaRaw {
  id_parcela: number
  id_projeto: number

  numero_parcela: number
  valor_parcela: string

  data_pagamento_prevista: string
  data_pagamento: string | null

  pago: boolean
}
