export type ProjetoParcela = {
  id: string
  projetoId: string

  numero_parcela: number
  valor_parcela: number

  data_pagamento_prevista: string
  data_pagamento?: string

  pago: boolean
}
