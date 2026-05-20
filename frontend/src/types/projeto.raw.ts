import { AuditEntry } from './audit'
import { EntregaRaw } from './entrega.raw'
import { VisitaRaw } from './visita.raw'
import { ProjetoParcelaRaw } from './projetoParcela.raw'
import { ProjetoExtraRaw } from './projetoExtra.raw'
import { PendenciaRaw } from './pendencia.raw'
import { EventoCriticoRaw } from './eventoCritico.raw'

export interface ProjetoRaw {
  id_projeto: number
  id_contrato: number
  id_cliente?: number

  titulo: string
  descricao: string | null

  data_inicio: string
  data_fim_prevista: string | null
  data_fim_real: string | null

  valor_total: string | number
  status: string
  atrasado?: boolean
  observacoes_gerais: string | null

  // Relacionados (Consolidação Operacional)
  entregas?: EntregaRaw[]
  visitas?: VisitaRaw[]
  parcelas?: ProjetoParcelaRaw[]
  extras?: ProjetoExtraRaw[]
  pendencias?: PendenciaRaw[]
  eventos_criticos?: EventoCriticoRaw[]

  // Inteligência (Back-First)
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
  
  // Novos campos consolidados (Fase 1)
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
