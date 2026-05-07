export interface EntregaRaw {
  id_entrega: number
  id_projeto: number

  descricao: string
  data_entrega_prevista: string
  data_entrega_real: string | null

  entregue: boolean
  referencia_doc: string | null
}
