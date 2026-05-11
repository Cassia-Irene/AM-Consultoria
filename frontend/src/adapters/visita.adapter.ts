import type { StatusVisita, ModalidadeVisita, TipoVisita } from '@/domain/visita'
import type { PendenciaCreateDTO } from './pendencia.adapter'

/**
 * visita.adapter.ts - VERSÃO PURA (V011)
 *
 * Remove toda e qualquer dependência de campos informais.
 * Alinhado 100% com as migrations oficiais.
 */

// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export interface PendenciaInput {
  descricao: string
  data_prazo: string
  responsavel: string
}

export interface NovaVisitaInput {
  clienteId: string 
  contratoId: string
  projetoId?: string
  status: StatusVisita
  
  tipo_visita: TipoVisita

  modalidade: ModalidadeVisita
  duracao_minutos: number
  data_hora: string 
  descricao: string
  resultados: string
  pendencias: PendenciaInput[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ─── Tipos de saída (Contrato IMUTÁVEL da API) ───────────────────────────────

export interface CriarVisitaRequest {
  id_contrato: number
  id_projeto: number | null
  status: string
  data_hora: string
  duracao_minutos: number | null
  tipo_visita: TipoVisita
  modalidade: string 
  descricao: string
  resultados: string | null
}

export interface CriarVisitaResponse {
  id_visita: number
  message?: string
  pendencias_falhas?: string[] 
}

// ─── Validação ────────────────────────────────────────────────────────────────

export function validateNovaVisitaInput(input: NovaVisitaInput): ValidationResult {
  const errors: string[] = []

  const TIPOS_VALIDOS: TipoVisita[] = [
    'rotineira', 'urgente', 'pontual', 'estruturada', 'acompanhamento direcionado'
  ]

  if (!input.clienteId) errors.push('clienteId é obrigatório')
  if (!input.contratoId) errors.push('contratoId é obrigatório')
  if (!input.data_hora) errors.push('data_hora é obrigatória')
  if (!input.modalidade) errors.push('modalidade é obrigatória')
  if (!input.status) errors.push('status é obrigatório')
  
  if (!input.tipo_visita) {
    errors.push('tipo_visita é obrigatório')
  } else if (!TIPOS_VALIDOS.includes(input.tipo_visita)) {
    errors.push(`tipo_visita inválido: ${input.tipo_visita}`)
  }

  if (!input.descricao?.trim()) errors.push('descricao é obrigatória')
  
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
    status: input.status.toLowerCase(),
    data_hora: new Date(input.data_hora).toISOString(),
    duracao_minutos: input.duracao_minutos || null,
    tipo_visita: input.tipo_visita,
    modalidade: input.modalidade,
    descricao: input.descricao || '',
    resultados: input.resultados || null,
  }
}

export function toPendenciasPayload(input: NovaVisitaInput, idVisita: number): PendenciaCreateDTO[] {
  return input.pendencias.map(p => ({
    id_visita: idVisita,
    id_contrato: Number(input.contratoId),
    descricao: p.descricao,
    responsavel: p.responsavel,
    data_origem: new Date(input.data_hora).toISOString().split('T')[0], 
    data_prazo: p.data_prazo ? p.data_prazo : null, 
    resolvida: false,
    data_resolucao: null
  }))
}
