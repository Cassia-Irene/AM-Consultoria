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
  valor_mensal: number
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