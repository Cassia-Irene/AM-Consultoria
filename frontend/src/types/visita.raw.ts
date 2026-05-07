export interface VisitaRaw {
  id: number | string
  clienteId: number | string
  contratoId?: number | string
  projetoId?: number | string

  data: string
  horario?: string
  criadaEm?: string

  tipo?: string
  modalidade?: string
  status?: string

  descricao?: string
  resultados?: string
  observacoes?: string

  ultimaVisitaEm?: string
  duracaoMinutos?: number
}