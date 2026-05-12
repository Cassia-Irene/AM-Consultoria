export type Contato = {
  id: string
  clienteId: string

  nome: string
  cargo?: string
  papel: string

  telefone_whatsapp?: string
  email?: string
  observacoes_gerais?: string
}
