/**
 * visita.adapter.ts
 *
 * FONTE DE VERDADE dos DTOs de criação de visita.
 */

import { ptBRToISO } from '@/utils/date'

// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export type TipoVisitaUI = 'rotina' | 'extra' | 'projeto'
export type StatusVisitaUI = 'agendada' | 'realizada' | 'cancelada'
export type ModalidadeVisitaUI = 'presencial' | 'online' | 'hibrida'
export type PrioridadePendenciaUI = 'urgente' | 'atencao' | 'normal'

export interface PendenciaInput {
  titulo: string
  prazo: string
  prioridade: PrioridadePendenciaUI
}

export interface NovaVisitaInput {
  clienteId: string // Apenas para UI
  contratoId: string
  projetoId?: string
  status: StatusVisitaUI
  tipo_visita: TipoVisitaUI
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
  titulo: string
  prazo: string
  prioridade: PrioridadePendenciaUI
  data_origem: string
}

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
  pendencias: PendenciaCriacaoDTO[]
}

export interface CriarVisitaResponse {
  id: string
  message: string
  pendencias_ids?: string[]
}

// ─── Validação ────────────────────────────────────────────────────────────────

export function validateNovaVisitaInput(input: NovaVisitaInput): ValidationResult {
  const errors: string[] = []

  if (!input.contratoId) errors.push('contratoId é obrigatório')
  if (!input.data_hora) errors.push('data_hora é obrigatória')
  if (!input.modalidade) errors.push('modalidade é obrigatória')
  if (!input.status) errors.push('status é obrigatório')
  if (!input.tipo_visita) errors.push('tipo_visita é obrigatório')
  if (!input.descricao?.trim()) errors.push('descricao não pode estar vazia')
  
  if (input.status === 'realizada' && !input.resultados?.trim()) {
    errors.push('resultados são obrigatórios para visitas realizadas')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Conversão ────────────────────────────────────────────────────────────────

export function toVisitaPayload(input: NovaVisitaInput): CriarVisitaRequest {
  return {
    id_contrato: Number(input.contratoId),
    id_projeto: input.projetoId ? Number(input.projetoId) : null,
    status: input.status,
    data_hora: input.data_hora,
    duracao_minutos: input.duracao_minutos || null,
    tipo_visita: input.tipo_visita,
    modalidade: input.modalidade,
    descricao: input.descricao || 'Sem descrição',
    resultados: input.resultados || null,
    pendencias: input.pendencias.map(p => ({
      titulo: p.titulo,
      prazo: ptBRToISO(p.prazo),
      prioridade: p.prioridade,
      data_origem: input.data_hora,
    })),
  }
}
