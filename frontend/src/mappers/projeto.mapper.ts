import type { Projeto, StatusProjeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'
import { IntegrationError } from '@/utils/errors'
import { mapEntrega } from './entrega.mapper'
import { mapVisita } from './visita.mapper'
import { mapParcela } from './projetoParcela.mapper'
import { mapExtra } from './projetoExtra.mapper'
import { mapPendencia } from './pendencia.mapper'
import { mapEventoCritico } from './eventoCritico.mapper'

export function mapProjeto(raw: ProjetoRaw): Projeto {
  // Validação Estrita (Back-First)
  if (!raw.id_projeto) {
    warnInvalidShape('Projeto:ID_MISSING', raw)
    throw new IntegrationError('Projeto', 'id_projeto ausente no contrato real', raw)
  }
  if (!raw.id_contrato) {
    warnInvalidShape('Projeto:CONTRATO_ID_MISSING', raw)
    throw new IntegrationError('Projeto', 'id_contrato ausente no contrato real', raw)
  }
  if (!raw.titulo) {
    warnInvalidShape('Projeto:TITULO_MISSING', raw)
    throw new IntegrationError('Projeto', 'titulo ausente no contrato real', raw)
  }

  validateShape<ProjetoRaw>('ProjetoRead', raw, [
    'id_projeto',
    'id_contrato',
    'titulo',
    'data_inicio',
    'valor_total',
    'status'
  ])

  return {
    id: String(raw.id_projeto),
    contratoId: String(raw.id_contrato),
    clienteId: raw.id_cliente ? String(raw.id_cliente) : undefined,

    titulo: raw.titulo,
    ...processDescription(raw.descricao),

    data_inicio: raw.data_inicio,
    data_fim_prevista: raw.data_fim_prevista ?? undefined,
    data_fim_real: raw.data_fim_real ?? undefined,

    valor_total: parseDecimal(raw.valor_total || '0'),

    status: normalizeStatus(raw.status || 'planejado'),
    atrasado: !!raw.atrasado,

    // Mapeamento de Relacionados (Consolidação de Dados)
    entregas: raw.entregas?.map(mapEntrega),
    visitas: raw.visitas?.map(mapVisita),
    parcelas: raw.parcelas?.map(mapParcela),
    extras: raw.extras?.map(mapExtra),
    pendencias: raw.pendencias?.map(mapPendencia),
    eventos: raw.eventos_criticos?.map(mapEventoCritico),

    score_tensao: raw.score_tensao,
    nivel_tensao: raw.nivel_tensao,
    motivo_tensao: raw.motivo_tensao,
    count_atrasos: raw.count_atrasos,
    is_estagnado: raw.is_estagnado,
    dias_sem_progresso: raw.dias_sem_progresso,
    motivo_estagnacao: raw.motivo_estagnacao,
    ritmo_operacional: raw.ritmo_operacional,
    motivo_ritmo: raw.motivo_ritmo,
    tendencia_tensao: raw.tendencia_tensao,
    reincidencia: raw.reincidencia ?? undefined,
    fase_operacional: raw.fase_operacional,
    evidencias: raw.evidencias,
    motivo_auditavel: raw.motivo_auditavel,
    esforco_vs_resultado: raw.esforco_vs_resultado,
    falso_movimento: !!raw.falso_movimento,
    override_ativo: !!raw.override_ativo,

    observacoes_gerais: raw.observacoes_gerais ?? undefined,

    // Mapeamento dos novos campos consolidados
    score_operacional: raw.score_operacional,
    tendencia: raw.tendencia,
    dias_sem_movimento: raw.dias_sem_movimento,
    desgaste_longitudinal: raw.desgaste_longitudinal,
    interpretacao_manual_ativa: !!raw.interpretacao_manual_ativa,
    snapshot_recente: raw.snapshot_recente,
    motivo_auditavel_resumido: raw.motivo_auditavel_resumido,
    evidencias_resumidas: raw.evidencias_resumidas,
    timeline: raw.timeline,
    backlog_meta: raw.backlog_meta,
    cadeia_causal: raw.cadeia_causal,
    impacto_do_override: raw.impacto_do_override,
    audit_history_resumo: raw.audit_history_resumo,
    percentual_conclusao: raw.percentual_conclusao,
  }
}

function processDescription(desc: string | null | undefined): { descricao?: string; isExtra?: boolean } {
  if (!desc) return {}
  
  const prefix = "PROJETO EXTRA"
  if (desc.toUpperCase().includes(prefix)) {
    // Remove o prefixo e o possível solicitante mencionado para deixar a descrição limpa
    const cleaned = desc.replace(new RegExp(prefix, "gi"), "").replace(/solicitado por.*?\.\s*/i, "").trim()
    return {
      descricao: cleaned || undefined,
      isExtra: true
    }
  }
  
  return { descricao: desc }
}

function normalizeStatus(status: string): StatusProjeto {
  const s = String(status || '').toLowerCase().trim()
  
  if (s === 'em andamento' || s === 'em_andamento') return 'em andamento'
  if (s === 'concluído' || s === 'concluido') return 'concluído'
  if (s === 'cancelado') return 'cancelado'
  
  return 'em andamento'
}

function parseDecimal(value: string | number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'))
  return isNaN(n) ? 0 : n
}
