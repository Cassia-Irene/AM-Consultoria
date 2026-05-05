export type ClienteStatus = 'ativo' | 'inativo'

export interface Cliente {
  id: string
  nome_instituicao: string
  tipo_instituicao: string
  cidade: string
  nivel_complexidade?: string
  modalidade_atendimento?: string
  observacoes_gerais?: string

  status: ClienteStatus

  // contexto de negócio (base, sem cálculo pesado)
  createdAt?: string
  updatedAt?: string
}