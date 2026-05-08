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

import { AppError } from '@/utils/errors'
import {
  toVisitaPayload,
  validateNovaVisitaInput,
  type NovaVisitaInput,
  type CriarVisitaResponse,
  type MotivoAcionamentoRead,
} from '@/adapters/visita.adapter'
import { fetchApi } from './api'
import { USE_MOCKS } from '@/config/env'
import { Visitas as VisitasMock } from '@/mocks/visitas'
import { mapVisita } from '@/mappers/visita.mapper'
import type { Visita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'

export type { NovaVisitaInput, CriarVisitaResponse } from '@/adapters/visita.adapter'

// ─── Service ─────────────────────────────────────────────────────────────────

export const VisitasService = {
  async getAll(): Promise<Visita[]> {
    if (USE_MOCKS) {
      return (VisitasMock as unknown as VisitaRaw[]).map(mapVisita)
    }
    try {
      const data = await fetchApi<VisitaRaw[]>('/visitas/')
      return data.map(mapVisita)
    } catch (err) {
      console.error('[SERVICE][ERROR] Falha ao buscar visitas:', err)
      return (VisitasMock as unknown as VisitaRaw[]).map(mapVisita)
    }
  },

  async getMotivosAcionamento(): Promise<MotivoAcionamentoRead[]> {
    if (USE_MOCKS) {
      return [
        { id_motivo: 1, nome: 'Conflito de Equipe', slug: 'conflito_equipe' },
        { id_motivo: 2, nome: 'Falta de Profissional', slug: 'falta_cuidador' },
        { id_motivo: 3, nome: 'Crise Operacional', slug: 'crise_operacional' },
      ]
    }
    try {
      return await fetchApi<MotivoAcionamentoRead[]>('/visitas/motivos-acionamento')
    } catch (err) {
      console.error('[SERVICE][ERROR] Falha ao buscar motivos:', err)
      return []
    }
  },

  async criar(input: NovaVisitaInput): Promise<CriarVisitaResponse> {
    // 1. Validar antes de chamar a API
    const { valid, errors } = validateNovaVisitaInput(input)
    if (!valid) {
      throw new AppError(
        `Dados inválidos: ${errors.join('; ')}`,
        'VALIDATION_ERROR',
        errors
      )
    }

    // 2. Converter para o formato da API
    const payload = toVisitaPayload(input)

    if (USE_MOCKS) {
      console.log('[SERVICE] Simulando POST /visitas (MOCK):', payload)
      await new Promise(resolve => setTimeout(resolve, 800))
      return { id_visita: Math.floor(Math.random() * 1000), message: 'Visita (MOCK) criada com sucesso' }
    }

    // 3. Enviar para API Real
    try {
      return await fetchApi<CriarVisitaResponse>('/visitas/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      throw new AppError(
        'Falha ao registrar visita no servidor.',
        'API_ERROR',
        err
      )
    }
  }
}
