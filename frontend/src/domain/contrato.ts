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

  status: StatusContrato

  valorMensal: number

  faturamento: {
    status: StatusFaturamento
    valor: number
    vencimento?: string
  }

  criadoEm: string
}