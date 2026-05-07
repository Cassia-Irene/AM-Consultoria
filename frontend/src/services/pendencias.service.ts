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
import { fetchApi } from './api'
import { USE_MOCKS } from '@/config/env'
import { Pendencias as PendenciasMock } from '@/mocks/pendencias'
import { mapPendencia } from '@/mappers/pendencia.mapper'
import type { Pendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'

export type { NovaPendenciaInput, CriarPendenciaResponse } from '@/adapters/pendencia.adapter'

export const PendenciasService = {
  async getAll(): Promise<Pendencia[]> {
    if (USE_MOCKS) {
      return (PendenciasMock as unknown as PendenciaRaw[]).map(mapPendencia)
    }

    try {
      const data = await fetchApi<PendenciaRaw[]>('/pendencias/')
      return data.map(mapPendencia)
    } catch (err) {
      console.error('[SERVICE][ERROR] Falha ao buscar pendências:', err)
      return (PendenciasMock as unknown as PendenciaRaw[]).map(mapPendencia)
    }
  },

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

    if (USE_MOCKS) {
      console.log('[SERVICE] Simulando POST /pendencias (MOCK):', payload)
      await new Promise(resolve => setTimeout(resolve, 800))
      return { id: `p-${Math.random()}`, message: 'Pendência (MOCK) criada com sucesso' }
    }

    try {
      return await fetchApi<CriarPendenciaResponse>('/pendencias/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      throw new AppError(
        'Falha ao registrar pendência no servidor.',
        'API_ERROR',
        err
      )
    }
  }
}
