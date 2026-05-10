// src/domain/contrato.ts
//
// Reflete 100% o NOVO MAPA LÓGICO `Contrato`.
// Registro contratual puro, sem lógica financeira (agora em FaturamentoCliente).

export type Contrato = {
  id: string                       // id_contrato (PK)
  clienteId: string                // id_cliente (FK)

  servicos_contratados: string
  visitas_previstas_mes: number
  inclui_relatorio: boolean

  data_inicio: string              // Date ISO 8601: YYYY-MM-DD
  data_fim?: string                // Nullable — null = contrato indeterminado
  
  /** 
   * @deprecated Campo híbrido. O Backend real não retorna valor_mensal no objeto Contrato.
   * Deve ser buscado em Faturamento ou ContratoPagamento.
   */
  valor_mensal?: number
  
  /** 
   * @deprecated Campo derivado. O Backend real não tem coluna status.
   * Derivado da data_fim no mapper.
   */
  status: 'ativo' | 'inativo' | 'suspenso'

  observacoes_gerais?: string      // Text nullable
}

export type HistoricoContrato = {
  id: string
  idContratoEncerrado: string
  idContratoNovo: string
  dataAlteracao: string
  motivo: string
}