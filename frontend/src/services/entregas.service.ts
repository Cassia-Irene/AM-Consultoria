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
      return getEntregas()
    }
  },

  async getByProjetoId(projetoId: string): Promise<Entrega[]> {
    const all = await this.getAll()
    return all.filter(e => e.projetoId === projetoId)
  }
}
