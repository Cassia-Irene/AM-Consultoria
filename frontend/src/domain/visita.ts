export type TipoVisita =
  | 'rotina'
  | 'extra'

export type Visita = {
  id: string
  clienteId: string

  data: string
  horario?: string

  tipo: TipoVisita

  criadaEm: string

  observacoes?: string
  ultimaVisitaEm?: string
}