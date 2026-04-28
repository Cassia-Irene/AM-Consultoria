export type ClienteStatus = 'ativo' | 'inativo'

export interface Cliente {
  id: string
  nome: string
  tipo?: string

  status: ClienteStatus

  // contexto de negócio (base, sem cálculo pesado)
  createdAt?: string
  updatedAt?: string
}