export interface ContratoRaw {
  id: number | string
  cliente: string

  status?: string

  faturamentoMes?: {
    status?: string
    valor?: number
    vencimento?: string
  }

  valorMensal?: number

  criadoEm?: string
}