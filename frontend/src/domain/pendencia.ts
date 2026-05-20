export type Pendencia = {
  id: string
  contratoId: string
  visitaId?: string
  descricao: string
  responsavel?: string
  data_origem: string
  data_prazo?: string
  resolvida: boolean
  data_resolucao?: string

  // Inteligência (Back-First)
  score_prioridade?: number
  motivo_prioridade?: string
  urgencia_label?: string
  dias_atraso?: number
}