// src/domain/contratoPagamento.ts
//
// Reflete a entidade CONTRATO_PAGAMENTO do banco.
// Registro simples de transação vinculada ao contrato.

export type ContratoPagamento = {
  id: string
  contratoId: string
  tipoPagamentoId: string
  valor: number
}
