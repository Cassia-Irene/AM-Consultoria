export interface VisitaRaw {
  id: number | string
  clienteId: number | string

  data: string
  criadaEm?: string

  horario?: string
  tipo?: string

  ultimaVisitaEm?: string
  observacoes?: string
}