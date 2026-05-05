export type TipoVisita =
  | 'rotina'
  | 'extra'

export type Visita = {
  id: string
  clienteId: string
  contratoId: string

  data_visita: string // Date from backend
  duracao_estimada_minutos?: number

  tipo: TipoVisita
  modalidade: string
  status: string

  descricao: string
  resultado: string

  criadaEm: string
  observacoes?: string
  ultimaVisitaEm?: string
}