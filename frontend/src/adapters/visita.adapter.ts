import type { StatusVisita, ModalidadeVisita } from '@/domain/visita'
import type { PendenciaCreateDTO } from './pendencia.adapter'
/**
 * visita.adapter.ts
 *
 * FONTE DE VERDADE dos DTOs de criação de visita.
 * Atualizado para suportar a arquitetura de Sensores Operacionais.
 */

// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export type TipoVisitaUI = 'rotineira' | 'urgente' | 'pontual' | 'estruturada' | 'acompanhamento_direcionado'
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
  status: StatusVisita
  
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
  
  modalidade: ModalidadeVisita
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

// ─── Tipos de saída (contrato exato da API OFICIAL) ──────────────────────────

export interface CriarVisitaRequest {
  id_contrato: number
  id_projeto: number | null
  status: string
  data_hora: string
  duracao_minutos: number | null
  tipo_visita: string
  modalidade: string
  descricao: string
  resultados: string | null
}

export interface CriarVisitaResponse {
  id_visita: number
  message?: string
  pendencias_falhas?: string[] // Descrições das pendências que não puderam ser salvas
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

  return { valid: errors.length === 0, errors }
}

// ─── Conversão ────────────────────────────────────────────────────────────────

/**
 * Converte a entrada da UI para o payload oficial da Visita.
 * Nota: Campos de Sensores Operacionais são capturados pela UI mas ignorados 
 * nesta versão conforme o princípio Back-First (não existem no backend oficial).
 */
export function toVisitaPayload(input: NovaVisitaInput): CriarVisitaRequest {
  return {
    id_contrato: Number(input.contratoId),
    id_projeto: input.projetoId ? Number(input.projetoId) : null,
    status: input.status.toLowerCase(),
    data_hora: new Date(input.data_hora).toISOString(),
    duracao_minutos: input.duracao_minutos || null,
    tipo_visita: input.tipo_visita,
    modalidade: input.modalidade === 'online' ? 'remota' : 'presencial',
    descricao: input.descricao || '',
    resultados: input.resultados || null,
  }
}

/**
 * Converte pendências da UI para o formato esperado pelo endpoint /pendencias/
 */
export function toPendenciasPayload(input: NovaVisitaInput, idVisita: number): PendenciaCreateDTO[] {
  return input.pendencias.map(p => ({
    id_visita: idVisita,
    id_contrato: Number(input.contratoId),
    descricao: p.descricao,
    responsavel: p.responsavel,
    data_origem: new Date(input.data_hora).toISOString().split('T')[0], // Backend espera date
    data_prazo: p.data_prazo ? p.data_prazo : null, // Backend espera date YYYY-MM-DD
    resolvida: false,
    data_resolucao: null
  }))
}
