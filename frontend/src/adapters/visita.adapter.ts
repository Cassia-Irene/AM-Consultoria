/**
 * visita.adapter.ts
 *
 * FONTE DE VERDADE dos DTOs de criação de visita.
 *
 * Responsabilidades:
 *   - Definir o contrato de entrada (NovaVisitaInput) — o que a UI fornece
 *   - Definir o contrato de saída (CriarVisitaRequest) — o que a API espera
 *   - Validar os dados antes da conversão
 *   - Converter entre os dois, incluindo formatos de data e nomenclatura
 *
 * O que NÃO é responsabilidade deste adapter:
 *   - Chamar a API (responsabilidade do service)
 *   - Renderizar erros (responsabilidade da UI)
 *   - Gerar IDs ou timestamps (responsabilidade do backend)
 */

import { ptBRToISO, datetimeLocalToDate } from '@/utils/date'

// ─── Tipos de entrada (o que a UI fornece) ────────────────────────────────────

export type TipoVisitaUI = 'Regular' | 'Extra'
export type PrioridadePendenciaUI = 'urgente' | 'atencao' | 'normal'

export interface PendenciaInput {
  titulo: string
  /** Formato pt-BR: dd/mm/yyyy — convertido para YYYY-MM-DD pelo adapter antes de enviar */
  prazo: string
  prioridade: PrioridadePendenciaUI
}

export interface NovaVisitaInput {
  clienteId: string
  contratoId: string
  tipoVisita: TipoVisitaUI
  modalidade: string
  /**
   * Decisão de design: duracao_estimada_minutos é obrigatório no banco (NOT NULL).
   * O frontend inicia com 60 como valor padrão, mas o usuário pode alterar.
   * Não deve ser inferido silenciosamente — deve refletir uma escolha real ou o default declarado.
   */
  duracao_estimada_minutos: number
  /** Formato datetime-local: YYYY-MM-DDTHH:mm — adapter extrai apenas a parte DATE */
  data_visita: string
  descricao: string
  resultado: string
  pendencias: PendenciaInput[]
}

// ─── Resultado de validação ───────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ─── Tipos de saída (contrato exato da API) ───────────────────────────────────

export interface PendenciaCriacaoDTO {
  titulo: string
  /** ISO 8601: YYYY-MM-DD */
  prazo: string
  prioridade: PrioridadePendenciaUI
  /**
   * Derivado da data_visita, não do momento de criação do payload.
   * Garante consistência entre data da visita e origem das pendências.
   *
   * BACKEND_DEPENDENCY: campo ignorado até o modelo Pendencia ser definido
   * em backend/src/models/pendencia.py e o relacionamento em visita.py
   * ser descomentado.
   */
  data_origem: string
}

export interface CriarVisitaRequest {
  id_cliente: number
  id_contrato: number
  /** ISO 8601: YYYY-MM-DD (coluna Date no banco — sem componente de hora) */
  data_visita: string
  duracao_estimada_minutos: number
  tipo_visita: 'rotina' | 'extra'
  modalidade: string
  descricao: string
  resultado: string
  /**
   * BACKEND_DEPENDENCY: pendencias são enviadas mas descartadas pelo backend
   * enquanto o modelo Pendencia não estiver implementado.
   * O relacionamento em visita.py está comentado temporariamente.
   */
  pendencias: PendenciaCriacaoDTO[]
  /**
   * observacoes NÃO está neste contrato intencionalmente.
   * O modelo SQLAlchemy visita.py não possui coluna observacoes.
   * Quando o backend adicionar a coluna, reabilitar aqui e em NovaVisitaInput.
   */
}

export interface CriarVisitaResponse {
  id: string
  message: string
  /**
   * IDs das pendências persistidas pelo backend.
   * BACKEND_DEPENDENCY: ausente enquanto pendencia.py não estiver implementado.
   * Quando presente, confirma que as pendências foram salvas com sucesso.
   */
  pendencias_ids?: string[]
}

// ─── Validação ────────────────────────────────────────────────────────────────

/** Valida os dados antes de chamar o adapter ou a API */
export function validateNovaVisitaInput(input: NovaVisitaInput): ValidationResult {
  const errors: string[] = []

  if (!input.clienteId) errors.push('clienteId é obrigatório')
  if (!input.contratoId) errors.push('contratoId é obrigatório')
  if (!input.data_visita) errors.push('data_visita é obrigatória')
  if (!input.modalidade) errors.push('modalidade é obrigatória')
  if (!input.resultado?.trim()) errors.push('resultado não pode estar vazio')
  if (input.duracao_estimada_minutos <= 0) {
    errors.push('duracao_estimada_minutos deve ser maior que zero')
  }

  // Verifica se a data tem o formato esperado (YYYY-MM-DD ou YYYY-MM-DDTHH:mm)
  const datePart = input.data_visita.split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    errors.push('data_visita inválida — use o seletor de data do formulário')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Conversão ────────────────────────────────────────────────────────────────

/** Converte NovaVisitaInput → CriarVisitaRequest (formato exato da API) */
export function toVisitaPayload(input: NovaVisitaInput): CriarVisitaRequest {
  const dataVisita = datetimeLocalToDate(input.data_visita)

  return {
    id_cliente: Number(input.clienteId),
    id_contrato: Number(input.contratoId),
    data_visita: dataVisita,
    duracao_estimada_minutos: input.duracao_estimada_minutos,
    tipo_visita: input.tipoVisita === 'Regular' ? 'rotina' : 'extra',
    modalidade: input.modalidade,
    descricao: input.descricao || 'Sem descrição',
    resultado: input.resultado || 'Sem resultados informados',
    pendencias: input.pendencias.map(p => ({
      titulo: p.titulo,
      prazo: ptBRToISO(p.prazo),
      prioridade: p.prioridade,
      data_origem: dataVisita,
    })),
  }
}
