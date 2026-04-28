export type StatusPendencia =
  | 'aberta'
  | 'em_andamento'
  | 'concluida'

export type Pendencia = {
  id: string
  titulo: string
  descricao?: string
  clienteId: string
  criadaEm: string
  prazo?: string
  concluidaEm?: string
  status: StatusPendencia
  origem?: {
    tipo: 'visita' | 'contrato' | 'manual'
    id?: string
    descricao?: string
  }
}