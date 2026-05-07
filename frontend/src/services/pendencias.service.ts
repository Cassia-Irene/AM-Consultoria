/**
 * pendencias.service.ts
 *
 * Orquestra o fluxo de criação manual de pendências.
 */

import { AppError } from '@/utils/errors'
import {
  toPendenciaPayload,
  validateNovaPendenciaInput,
  type NovaPendenciaInput,
  type CriarPendenciaResponse,
} from '@/adapters/pendencia.adapter'

export type { NovaPendenciaInput, CriarPendenciaResponse } from '@/adapters/pendencia.adapter'

export const PendenciasService = {
  async criar(input: NovaPendenciaInput): Promise<CriarPendenciaResponse> {
    const { valid, errors } = validateNovaPendenciaInput(input)
    if (!valid) {
      throw new AppError(
        `Dados inválidos: ${errors.join('; ')}`,
        'VALIDATION_ERROR',
        errors
      )
    }

    const payload = toPendenciaPayload(input)

    try {
      console.log('[API POST /pendencias] Payload:', payload)
      // MOCK temporário simulando ida ao banco
      await new Promise(resolve => setTimeout(resolve, 800))
      return { id: `p-gerada-${Math.floor(Math.random() * 10000)}`, message: 'Pendência criada com sucesso' }

    } catch (err) {
      throw new AppError(
        'Falha ao comunicar com o servidor. Tente novamente.',
        'API_ERROR',
        err
      )
    }
  }
}
