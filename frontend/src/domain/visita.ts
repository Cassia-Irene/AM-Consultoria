export type StatusVisita =
  | 'agendada'
  | 'realizada'
  | 'cancelada'

export type TipoVisita =
  | 'rotina'
  | 'extra'
  | 'projeto'

export type ModalidadeVisita =
  | 'presencial'
  | 'online'
  | 'hibrida'

export type Visita = {
  id: string

  contratoId: string
  projetoId?: string

  status: StatusVisita

  data_hora: string

  duracao_minutos?: number

  tipo_visita: TipoVisita
  modalidade: ModalidadeVisita

  descricao: string
  resultados?: string
}