/**
 * pendencia.adapter.ts
 *
 * FONTE DE VERDADE dos DTOs de criação de pendências manuais.
 */

import type { Pendencia } from '@/domain/pendencia'

// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export interface NovaPendenciaInput {
  contratoId: string
  descricao: string
  responsavel: string
  data_prazo?: string
  resolvida: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ─── Tipos de saída (contrato exato da API) ───────────────────────────────────

export interface PendenciaCreateDTO {
  id_contrato: number
  id_visita: number | null
  descricao: string
  responsavel: string
  data_origem: string      // YYYY-MM-DD
  data_prazo: string | null // YYYY-MM-DD
  resolvida: boolean
  data_resolucao: string | null // YYYY-MM-DD
}

export interface CriarPendenciaResponse {
  id: string
  message: string
}

// ─── Validação ────────────────────────────────────────────────────────────────

export function validateNovaPendenciaInput(input: NovaPendenciaInput): ValidationResult {
  const errors: string[] = []

  if (!input.contratoId) errors.push('Obrigatório selecionar um contrato')
  if (!input.descricao?.trim()) errors.push('A descrição não pode estar vazia')
  if (!input.responsavel?.trim()) errors.push('Obrigatório informar um responsável')

  return { valid: errors.length === 0, errors }
}

// ─── Conversão ────────────────────────────────────────────────────────────────

export function toPendenciaPayload(input: NovaPendenciaInput): PendenciaCreateDTO {
  const hoje = new Date().toISOString().split('T')[0]
  
  return {
    id_contrato: Number(input.contratoId),
    id_visita: null,
    descricao: input.descricao.trim(),
    responsavel: input.responsavel.trim(),
    data_origem: hoje,
    data_prazo: input.data_prazo || null,
    resolvida: input.resolvida,
    data_resolucao: input.resolvida ? hoje : null,
  }
}

// Retrocompatibilidade para atualizar pendencia existente caso necessário no futuro
export function pendenciaToPayload(pendencia: Pendencia): CriarPendenciaRequest {
  return {
    id_contrato: Number(pendencia.contratoId),
    id_visita: pendencia.visitaId ? Number(pendencia.visitaId) : null,
    descricao: pendencia.descricao,
    responsavel: pendencia.responsavel,
    data_origem: pendencia.data_origem,
    data_prazo: pendencia.data_prazo ?? null,
    resolvida: pendencia.resolvida,
    data_resolucao: pendencia.data_resolucao ?? null,
  }
}
