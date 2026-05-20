export interface VisitaRaw {
  id_visita: number
  id_contrato: number
  id_projeto: number | null

  // Aliases para compatibilidade híbrida
  id?: number | string
  contratoId?: number | string
  projetoId?: number | string | null

  status: string

  data_hora: string

  duracao_minutos: number | null

  tipo_visita: string
  modalidade: string

  descricao: string
  resultados: string | null
}