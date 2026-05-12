export type Contato = {
  id: string
  clienteId: string

  nome: string
  cargo?: string
  papel: string

  telefone_whatsapp?: string
  email?: string
  isPrincipal?: boolean
  status?: 'ativo' | 'inativo' | 'arquivado'
  observacoes_gerais?: string
}
