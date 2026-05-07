export interface EventoCriticoRaw {
  id_evento: number
  id_contrato: number
  id_visita: number | null
  data_evento: string
  descricao: string
  acao_tomada: string | null
}
