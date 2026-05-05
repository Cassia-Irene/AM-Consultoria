// src/domain/contrato.ts

export type StatusContrato =
  | 'ativo'
  | 'inativo'

export type StatusFaturamento =
  | 'pago'
  | 'pendente'
  | 'atrasado'

export type Contrato = {
  id: string
  clienteId: string

  tipo_cobranca: string
  valorMensal: number
  visitas_previstas_mes: number
  valor_visita_extra?: number
  
  inclui_relatorio: boolean
  data_inicio: string
  data_fim?: string

  status: StatusContrato

  faturamento: {
    status: StatusFaturamento
    valor: number
    vencimento?: string
  }

  motivo_alteracao?: string
  observacoes?: string

  criadoEm: string
}