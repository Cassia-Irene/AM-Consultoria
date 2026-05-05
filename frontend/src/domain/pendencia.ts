export type StatusPendencia =
  | 'aberta'
  | 'em_andamento'
  | 'concluida'

export type PrioridadePendencia = 'urgente' | 'atencao' | 'normal'

export type Pendencia = {
  id: string
  titulo: string
  
  clienteId: string
  contratoId: string
  visitaId?: string // Opcional, pode ser criada avulsa
  
  status: StatusPendencia
  prioridade: PrioridadePendencia
  
  prazo?: string // O ideal é evoluir isso para data_vencimento
  data_origem?: string
  data_resolucao?: string
  
  descricao?: string
  
  criadaEm: string
  atualizadaEm: string
}