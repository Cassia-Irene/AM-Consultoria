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
  toPendenciasPayload,
  validateNovaVisitaInput,
  type NovaVisitaInput,
  type CriarVisitaResponse,
  type MotivoAcionamentoRead,
} from '@/adapters/visita.adapter'
import { fetchApi } from './api'
import { mapVisita } from '@/mappers/visita.mapper'
import type { Visita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'

export type { NovaVisitaInput, CriarVisitaResponse } from '@/adapters/visita.adapter'

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * VisitasService - Integração Vertical Real (Back-First)
 * 
 * Agora consome obrigatoriamente a API oficial para estabilizar o contrato.
 */
export const VisitasService = {
  async getAll(): Promise<Visita[]> {
    try {
      // Forçamos a API Real para Visitas (Back-First)
      const data = await fetchApi<VisitaRaw[]>('/visitas/')
      return data.map(mapVisita)
    } catch (err) {
      console.error('[SERVICE][ERROR] Falha ao buscar visitas reais:', err)
      throw new AppError('Não foi possível carregar as visitas do servidor.', 'API_ERROR', err)
    }
  },

  async getById(id: string | number): Promise<Visita> {
    try {
      const data = await fetchApi<VisitaRaw>(`/visitas/${id}`)
      return mapVisita(data)
    } catch (err) {
      console.error(`[SERVICE][ERROR] Falha ao buscar visita ${id}:`, err)
      throw new AppError('Falha ao carregar detalhes da visita.', 'API_ERROR', err)
    }
  },

  async getMotivosAcionamento(): Promise<MotivoAcionamentoRead[]> {
    try {
      return await fetchApi<MotivoAcionamentoRead[]>('/visitas/motivos-acionamento')
    } catch (err) {
      console.error('[SERVICE][ERROR] Falha ao buscar motivos:', err)
      // Fallback silencioso para motivos se o endpoint falhar
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

    // 2. Converter para o formato da API OFICIAL
    const payloadVisita = toVisitaPayload(input)

    try {
      // PASSO 1: Criar a Visita
      const responseVisita = await fetchApi<CriarVisitaResponse>('/visitas/', {
        method: 'POST',
        body: JSON.stringify(payloadVisita),
      })

      const { id_visita } = responseVisita

      // PASSO 2: Criar Pendências (se houver)
      if (input.pendencias && input.pendencias.length > 0) {
        const payloadPendencias = toPendenciasPayload(input, id_visita)
        
        // Disparamos as criações de pendências individualmente
        // Nota: Em um sistema crítico, usaríamos Promise.allSettled ou trataríamos falhas parciais
        for (const pendencia of payloadPendencias) {
          try {
            await fetchApi('/pendencias/', {
              method: 'POST',
              body: JSON.stringify(pendencia),
            })
          } catch (pErr) {
            console.error('[SERVICE][WARN] Falha ao criar pendência individual:', pErr)
            // Não barramos o fluxo principal se uma pendência falhar, apenas logamos
          }
        }
      }

      return { 
        id_visita, 
        message: 'Visita e pendências registradas com sucesso no backend oficial.' 
      }
    } catch (err) {
      throw new AppError(
        'Falha ao registrar visita no servidor oficial.',
        'API_ERROR',
        err
      )
    }
  }
}
