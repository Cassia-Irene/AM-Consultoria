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
  status?: 'ativo' | 'suspenso' | 'inativo'

  // Inteligência (Back-First)
  indice_urgencia?: number
  indice_desgaste?: number
  perfil?: string
  motivo_saude?: string
  intensidade_operacional?: string
  desgaste_acumulado?: number
  personalidade?: string
  tendencia_relacionamento?: string
  evidencias?: string[]
  motivo_auditavel?: string
  desgaste_longitudinal?: number
  dependencia_operacional?: string
  capacidade_recuperacao?: string
  perfil_pragmatico?: string
  override_ativo?: boolean
}

export type HistoricoContrato = {
  id: string
  contratoId: string
  data_alteracao: string
  evento: string
  valor_anterior?: number
  valor_novo?: number
}