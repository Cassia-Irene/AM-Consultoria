export type ClienteStatus = 'ativo' | 'inativo'

export interface Cliente {
  id: string
  nome_instituicao: string
  tipo_instituicao: string
  cidade: string
  nivel_complexidade?: string
  observacoes_gerais?: string
  status: ClienteStatus
}