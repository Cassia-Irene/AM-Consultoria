export interface PendenciaRaw {
  id: number | string
  titulo: string
  clienteId: string
  status: string
  prazo?: string | null
  criadaEm: string

  origemTipo?: string
  origemDescricao?: string
}