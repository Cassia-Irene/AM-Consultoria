import { AuditEntry } from '@/types/audit'
import { Entrega } from './entrega'
import { Visita } from './visita'
import { ProjetoParcela } from './projetoParcela'
import { ProjetoExtra } from './projetoExtra'
import { Pendencia } from './pendencia'
import { EventoCritico } from './eventoCritico'

export type StatusProjeto =
  | 'em andamento'
  | 'concluído'
  | 'cancelado'

export type Projeto = {
  id: string
  contratoId: string
  clienteId?: string

  titulo: string
  descricao?: string

  data_inicio: string              // ISO 8601
  data_fim_prevista?: string       // nullable
  data_fim_real?: string           // nullable — preenchido ao concluir

  valor_total: number

  status: StatusProjeto
  atrasado?: boolean
  isExtra?: boolean

  // Relacionados
  entregas?: Entrega[]
  visitas?: Visita[]
  parcelas?: ProjetoParcela[]
  extras?: ProjetoExtra[]
  pendencias?: Pendencia[]
  eventos?: EventoCritico[]

  score_tensao?: number
  nivel_tensao?: string
  motivo_tensao?: string
  count_atrasos?: number
  is_estagnado?: boolean
  dias_sem_progresso?: number
  motivo_estagnacao?: string
  ritmo_operacional?: string
  motivo_ritmo?: string
  tendencia_tensao?: string
  reincidencia?: string
  fase_operacional?: string
  evidencias?: string[]
  motivo_auditavel?: string
  esforco_vs_resultado?: string
  falso_movimento?: boolean
  override_ativo?: boolean
  observacoes_gerais?: string

  // Campos consolidados
  score_operacional?: number
  tendencia?: string
  dias_sem_movimento?: number
  desgaste_longitudinal?: string
  interpretacao_manual_ativa?: boolean
  snapshot_recente?: string | null
  motivo_auditavel_resumido?: string
  evidencias_resumidas?: string[]
  percentual_conclusao?: number
  
  timeline?: {
    data: string
    tipo: 'entrega_concluida' | 'atraso_critico' | 'evento_critico' | 'governança'
    label: string
    impacto: 'positivo' | 'negativo' | 'neutro'
  }[]
  
  backlog_meta?: {
    aging_medio: number
    itens_criticos: number
  }
  
  cadeia_causal?: string[]
  impacto_do_override?: string
  audit_history_resumo?: AuditEntry[]
}
