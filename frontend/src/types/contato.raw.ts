export interface ContatoRaw {
  id_contato: number
  id_cliente: number

  // Aliases para compatibilidade híbrida
  id?: number | string
  clienteId?: number | string

  nome: string
  cargo: string | null
  papel: string

  telefone_whatsapp: string | null
  email: string | null
  observacoes_gerais: string | null
}
