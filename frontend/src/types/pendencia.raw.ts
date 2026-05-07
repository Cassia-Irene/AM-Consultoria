export interface PendenciaRaw {
  id_pendencia: number
  id_contrato: number
  id_visita: number | null
  
  // Aliases para compatibilidade híbrida
  id?: number | string
  contratoId?: number | string
  visitaId?: number | string | null

  descricao: string
  responsavel: string
  data_origem: string
  data_prazo: string | null
  resolvida: boolean
  data_resolucao: string | null
}