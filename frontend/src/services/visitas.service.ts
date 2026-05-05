/**
 * visitas.service.ts
 *
 * Orquestra o fluxo: UI → validação → conversão → API
 *
 *   1. Recebe NovaVisitaInput da UI (dados brutos)
 *   2. Valida antes de qualquer conversão
 *   3. Chama o adapter para gerar o payload correto
 *   4. Envia para a API e trata erros
 *
 * NÃO contém lógica de negócio nem formatação de dados.
 * NÃO define DTOs — todos definidos em visita.adapter.ts.
 */

import { fetchApi } from './api'
import {
  toVisitaPayload,
  validateNovaVisitaInput,
  type NovaVisitaInput,
  type CriarVisitaResponse,
} from '@/adapters/visita.adapter'

export type { NovaVisitaInput, CriarVisitaResponse } from '@/adapters/visita.adapter'

// ─── Erro tipado do service ───────────────────────────────────────────────────

export class VisitaServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION_ERROR' | 'API_ERROR' | 'UNKNOWN',
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'VisitaServiceError'
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const VisitasService = {
  async criar(input: NovaVisitaInput): Promise<CriarVisitaResponse> {
    // 1. Validar antes de chamar a API — falha rápida, mensagem clara
    const { valid, errors } = validateNovaVisitaInput(input)
    if (!valid) {
      throw new VisitaServiceError(
        `Dados inválidos: ${errors.join('; ')}`,
        'VALIDATION_ERROR',
        errors
      )
    }

    // 2. Converter para o formato da API
    const payload = toVisitaPayload(input)

    // 3. Enviar — erros da API são capturados e relançados como VisitaServiceError
    try {
      // TODO: descomentar quando a API estiver disponível
      // return await fetchApi<CriarVisitaResponse>('/visitas', {
      //   method: 'POST',
      //   body: JSON.stringify(payload),
      // })

      console.log('[API POST /visitas] Payload:', payload)
      await new Promise(resolve => setTimeout(resolve, 800))
      return { id: 'v-gerado-123', message: 'Visita e pendências criadas com sucesso' }

    } catch (err) {
      // Nunca repassa o erro bruto da API — UI recebe mensagem de domínio
      throw new VisitaServiceError(
        'Falha ao comunicar com o servidor. Tente novamente.',
        'API_ERROR',
        err
      )
    }
  }
}
