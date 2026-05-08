/**
 * visita.adapter.ts
 *
 * FONTE DE VERDADE dos DTOs de criação de visita.
 * Atualizado para suportar a arquitetura de Sensores Operacionais.
 */

// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export type TipoVisitaUI = 'rotineira' | 'urgente' | 'pontual' | 'estruturada' | 'acompanhamento_direcionado'
export type StatusVisitaUI = 'agendada' | 'realizada' | 'cancelada'
export type ModalidadeVisitaUI = 'presencial' | 'online' | 'hibrida'
export type ContextoAgendamentoUI = 'planejado' | 'extra_proativo' | 'extra_reativo'
export type OrigemSolicitacaoUI = 'whatsapp' | 'telefone' | 'email' | 'presencial'
export type SeveridadeUI = 'baixa' | 'moderada' | 'alta' | 'critica'

export interface PendenciaInput {
  descricao: string
  data_prazo: string
  responsavel: string
}

export interface NovaVisitaInput {
  clienteId: string // Apenas para UI
  contratoId: string
  projetoId?: string
  status: StatusVisitaUI
  
  // 🧠 Novas Dimensões Operacionais
  tipo_visita: TipoVisitaUI
  contexto_agendamento: ContextoAgendamentoUI
  
  // 🚦 Contexto de Caos/Extra
  origem_solicitacao?: OrigemSolicitacaoUI
  id_contato_solicitante?: number
  motivo_acionamento_id?: number
  descricao_trigger?: string
  
  // 🔥 Métricas
  severidade_operacional?: SeveridadeUI
  tempo_resposta_minutos?: number
  impacto_operacional?: string
  
  modalidade: ModalidadeVisitaUI
  duracao_minutos: number
  data_hora: string // YYYY-MM-DDTHH:mm
  descricao: string
  resultados: string
  pendencias: PendenciaInput[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ─── Tipos de saída (contrato exato da API) ───────────────────────────────────

export interface PendenciaCriacaoDTO {
  descricao: string
  responsavel: string
  data_origem: string
  data_prazo: string | null
  resolvida: boolean
  data_resolucao: string | null
}

export interface CriarVisitaRequest {
  id_cliente: number
  id_contrato: number
  id_projeto: number | null
  status: string
  data_hora: string
  duracao_estimada_minutos: number | null
  
  // 🧠 Dimensões
  tipo_visita: string
  contexto_agendamento: string
  
  // 🚦 Caos
  origem_solicitacao: string | null
  id_contato_solicitante: number | null
  motivo_acionamento_id: number | null
  descricao_trigger: string | null
  
  // 🔥 Impacto
  severidade_operacional: string | null
  tempo_resposta_minutos: number | null
  impacto_operacional: string | null
  
  modalidade: string
  descricao: string
  resultados: string | null
  pendencias: PendenciaCriacaoDTO[]
}

export interface CriarVisitaResponse {
  id_visita: number
  message?: string
}

export interface MotivoAcionamentoRead {
  id_motivo: number
  nome: string
  slug: string
  descricao?: string
}

// ─── Validação ────────────────────────────────────────────────────────────────

export function validateNovaVisitaInput(input: NovaVisitaInput): ValidationResult {
  const errors: string[] = []

  if (!input.clienteId) errors.push('clienteId é obrigatório')
  if (!input.contratoId) errors.push('contratoId é obrigatório')
  if (!input.data_hora) errors.push('data_hora é obrigatória')
  if (!input.modalidade) errors.push('modalidade é obrigatória')
  if (!input.status) errors.push('status é obrigatório')
  if (!input.tipo_visita) errors.push('tipo_visita é obrigatório')
  if (!input.contexto_agendamento) errors.push('contexto_agendamento é obrigatório')
  if (!input.descricao?.trim()) errors.push('descricao não pode estar vazia')
  
  if (input.status === 'realizada' && !input.resultados?.trim()) {
    errors.push('resultados são obrigatórios para visitas realizadas')
  }

  // Validação condicional para acionamentos extras
  if (input.contexto_agendamento === 'extra_reativo') {
    if (!input.origem_solicitacao) errors.push('Origem da solicitação é necessária para visitas reativas')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Conversão ────────────────────────────────────────────────────────────────

export function toVisitaPayload(input: NovaVisitaInput): CriarVisitaRequest {
  return {
    id_cliente: Number(input.clienteId),
    id_contrato: Number(input.contratoId),
    id_projeto: input.projetoId ? Number(input.projetoId) : null,
    status: input.status === 'realizada' ? 'Realizada' : input.status === 'agendada' ? 'Agendada' : 'Cancelada',
    data_hora: new Date(input.data_hora).toISOString(),
    duracao_estimada_minutos: input.duracao_minutos || null,
    
    // 🧠 Dimensões
    tipo_visita: input.tipo_visita,
    contexto_agendamento: input.contexto_agendamento,
    
    // 🚦 Caos
    origem_solicitacao: input.origem_solicitacao || null,
    id_contato_solicitante: input.id_contato_solicitante || null,
    motivo_acionamento_id: input.motivo_acionamento_id || null,
    descricao_trigger: input.descricao_trigger || null,
    
    // 🔥 Impacto
    severidade_operacional: input.severidade_operacional || null,
    tempo_resposta_minutos: input.tempo_resposta_minutos || null,
    impacto_operacional: input.impacto_operacional || null,
    
    modalidade: input.modalidade === 'online' ? 'Remoto' : 'Presencial',
    descricao: input.descricao || 'Sem descrição',
    resultados: input.resultados || null,
    pendencias: input.pendencias.map(p => ({
      descricao: p.descricao,
      responsavel: p.responsavel,
      data_origem: new Date(input.data_hora).toISOString(),
      data_prazo: p.data_prazo ? new Date(p.data_prazo + 'T12:00:00Z').toISOString() : null,
      resolvida: false,
      data_resolucao: null
    })),
  }
}
