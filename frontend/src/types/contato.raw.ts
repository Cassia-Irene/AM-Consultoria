export interface ContatoRaw {
  id_contato: number
  id_cliente: number

  nome: string
  cargo: string | null
  papel: string

  telefone_whatsapp: string | null
  email: string | null
  observacoes_gerais: string | null
}
