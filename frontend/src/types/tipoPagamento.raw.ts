// src/types/tipoPagamento.raw.ts
//
// Shape do JSON da API para TIPOS_PAGAMENTO.

export interface TipoPagamentoRaw {
  id_tipo: number

  // Aliases para compatibilidade híbrida
  id?: number | string

  tipo: string
}
