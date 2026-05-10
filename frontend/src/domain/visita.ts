export type StatusVisita =
  | 'agendada'
  | 'realizada'
  | 'cancelada'


export type ModalidadeVisita =
  | 'presencial'
  | 'remota'

export type TipoVisita = 
  | 'rotineira'
  | 'urgente'
  | 'pontual'
  | 'estruturada'
  | 'acompanhamento direcionado'

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