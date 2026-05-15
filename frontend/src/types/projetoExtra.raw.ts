export interface ProjetoExtraRaw {
  id_extra: number
  id_projeto: number

  // Aliases para compatibilidade híbrida
  id?: number | string
  projetoId?: number | string

  solicitado_por: number
  aprovado_por: number | null
  solicitado_por_nome?: string
  aprovado_por_nome?: string
}
