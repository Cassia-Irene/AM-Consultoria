import { fetchApi } from './api'
import { mapEntrega, getEntregas } from '@/mappers/entrega.mapper'
import type { Entrega } from '@/domain/entrega'
import type { EntregaRaw } from '@/types/entrega.raw'
import { USE_MOCKS } from '@/config/env'

export const EntregasService = {
  async getAll(): Promise<Entrega[]> {
    if (USE_MOCKS) return getEntregas()
    try {
      const data = await fetchApi<EntregaRaw[]>('/entregas/')
      return data.map(mapEntrega)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar entregas:', error)
      return []
    }
  },

  async getById(id: string | number): Promise<Entrega | null> {
    const all = await this.getAll()
    return all.find(e => String(e.id) === String(id)) || null
  },

  async getByProjetoId(projetoId: string | number): Promise<Entrega[]> {
    const all = await this.getAll()
    return all.filter(e => String(e.projetoId) === String(projetoId))
  },

  async create(data: Partial<EntregaRaw>): Promise<Entrega> {
    const response = await fetchApi<EntregaRaw>('/entregas/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return mapEntrega(response)
  },

  async update(id: string | number, data: Partial<EntregaRaw>): Promise<Entrega> {
    const response = await fetchApi<EntregaRaw>(`/entregas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    return mapEntrega(response)
  }
}
