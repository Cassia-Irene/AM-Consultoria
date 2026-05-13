// src/types/contrato.raw.ts
//
// Shape do JSON que a API retorna — espelha exatamente o ContratoRead (backend real)

export interface ContratoRaw {
  id_contrato: number
  id_cliente: number

  servicos_contratados: string
  visitas_previstas_mes: number
  inclui_relatorio: boolean

  data_inicio: string         // ISO 8601: "YYYY-MM-DD"
  data_fim: string | null
  
  observacoes_gerais: string | null
  valor_mensal?: string | number // Novo campo híbrido (property)
}

export interface HistoricoContratoRaw {
  id_historico: number
  id_contrato_encerrado: number
  id_contrato_novo: number
  data_alteracao: string      // ISO 8601: "YYYY-MM-DD"
  motivo_alteracao: string
}