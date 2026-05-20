export type Entrega = {
  id: string
  projetoId: string

  descricao: string
  data_entrega_prevista: string
  data_entrega_real?: string

  entregue: boolean
  referencia_doc?: string
}
