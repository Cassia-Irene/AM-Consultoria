import { AppError } from '@/utils/errors'
import {
  toVisitaPayload,
  toPendenciasPayload,
  validateNovaVisitaInput,
  type NovaVisitaInput,
  type CriarVisitaResponse,
} from '@/adapters/visita.adapter'
import { fetchApi } from './api'
import { mapVisita } from '@/mappers/visita.mapper'
import type { Visita } from '@/domain/visita'
import type { VisitaRaw } from '@/types/visita.raw'

export type { NovaVisitaInput, CriarVisitaResponse } from '@/adapters/visita.adapter'

export const VisitasService = {
  async getAll(): Promise<Visita[]> {
    try {
      const data = await fetchApi<VisitaRaw[]>('/visitas/')
      return data.map(mapVisita)
    } catch (err) {
      console.error('[SERVICE][ERROR] Falha ao buscar visitas:', err)
      throw new AppError('Não foi possível carregar as visitas.', 'API_ERROR', err)
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

  async criar(input: NovaVisitaInput): Promise<CriarVisitaResponse> {
    const { valid, errors } = validateNovaVisitaInput(input)
    if (!valid) {
      throw new AppError(`Dados inválidos: ${errors.join('; ')}`, 'VALIDATION_ERROR', errors)
    }

    const payloadVisita = toVisitaPayload(input)

    try {
      const responseVisita = await fetchApi<CriarVisitaResponse>('/visitas/', {
        method: 'POST',
        body: JSON.stringify(payloadVisita),
      })

      const { id_visita } = responseVisita
      const pendenciasFalhas: string[] = []

      if (input.pendencias && input.pendencias.length > 0) {
        const payloadPendencias = toPendenciasPayload(input, id_visita)
        for (const pendencia of payloadPendencias) {
          try {
            await fetchApi('/pendencias/', {
              method: 'POST',
              body: JSON.stringify(pendencia),
            })
          } catch (pErr) {
            console.error('[SERVICE][WARN] Falha ao criar pendência:', pErr)
            pendenciasFalhas.push(pendencia.descricao)
          }
        }
      }

      return { 
        id_visita, 
        message: pendenciasFalhas.length > 0 
          ? `Visita criada, mas ${pendenciasFalhas.length} pendência(s) falharam.` 
          : 'Visita registrada com sucesso.',
        pendencias_falhas: pendenciasFalhas.length > 0 ? pendenciasFalhas : undefined
      }
    } catch (err) {
      throw new AppError('Falha ao registrar visita no servidor.', 'API_ERROR', err)
    }
  }
}
