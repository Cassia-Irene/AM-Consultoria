import { AppError } from '@/utils/errors'
import { fetchApi } from './api'
import { USE_MOCKS } from '@/config/env'

export interface VisitaExtraRaw {
  id_extra: number
  id_visita: number
  solicitado_por: number
}

// Persistência em memória no ambiente de mocks (desenvolvimento/teste)
const mockVisitasExtras: VisitaExtraRaw[] = [
  { id_extra: 1, id_visita: 3, solicitado_por: 1 }
]

export const VisitasExtraService = {
  async getAll(): Promise<VisitaExtraRaw[]> {
    if (USE_MOCKS) {
      return mockVisitasExtras
    }
    try {
      return await fetchApi<VisitaExtraRaw[]>('/visitas-extra/')
    } catch (err) {
      console.error('[VISITAS_EXTRA_SERVICE][getAll]', err)
      throw new AppError('Falha ao buscar visitas extras.', 'API_ERROR', err)
    }
  },

  async create(payload: Omit<VisitaExtraRaw, 'id_extra'>): Promise<VisitaExtraRaw> {
    if (USE_MOCKS) {
      const newExtra: VisitaExtraRaw = {
        id_extra: mockVisitasExtras.length > 0 ? Math.max(...mockVisitasExtras.map(m => m.id_extra)) + 1 : 1,
        id_visita: Number(payload.id_visita),
        solicitado_por: Number(payload.solicitado_por)
      }
      mockVisitasExtras.push(newExtra)
      return newExtra
    }
    try {
      return await fetchApi<VisitaExtraRaw>('/visitas-extra/', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    } catch (err) {
      console.error('[VISITAS_EXTRA_SERVICE][create]', err)
      throw new AppError('Falha ao registrar visita extra.', 'API_ERROR', err)
    }
  },

  async update(id: number | string, updates: Partial<Omit<VisitaExtraRaw, 'id_extra'>>): Promise<VisitaExtraRaw> {
    if (USE_MOCKS) {
      const found = mockVisitasExtras.find(v => String(v.id_extra) === String(id))
      if (found) {
        if (updates.id_visita !== undefined) found.id_visita = Number(updates.id_visita)
        if (updates.solicitado_por !== undefined) found.solicitado_por = Number(updates.solicitado_por)
        return found
      }
      throw new AppError('Visita extra não encontrada nos mocks.', 'INTEGRATION_ERROR')
    }
    try {
      return await fetchApi<VisitaExtraRaw>(`/visitas-extra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error('[VISITAS_EXTRA_SERVICE][update]', err)
      throw new AppError('Falha ao atualizar visita extra.', 'API_ERROR', err)
    }
  }
}
