export type Contrato = {
  id: string
  clienteId: string
  
  data_inicio: string
  data_fim?: string
  servicos_contratados: string
  visitas_previstas_mes: number
  inclui_relatorio: boolean
  
  valor_mensal: number
  observacoes_gerais: string

  // Inteligência (Back-First)
  indice_urgencia?: number
  indice_desgaste?: number
  perfil?: string
}

export type HistoricoContrato = {
  id: string
  contratoId: string
  data_alteracao: string
  evento: string
  valor_anterior?: number
  valor_novo?: number
}