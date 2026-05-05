export interface ContratoRaw {
  id: number | string
  cliente: string
  clienteId?: number | string
  status?: string

  faturamentoMes?: {
    status?: string
    valor?: number
    vencimento?: string
  }

  valorMensal?: number
  criadoEm?: string

  tipo_cobranca?: string
  visitas_previstas_mes?: number
  valor_visita_extra?: number
  inclui_relatorio?: boolean
  data_inicio?: string
  data_fim?: string
  motivo_alteracao?: string
  observacoes?: string
}