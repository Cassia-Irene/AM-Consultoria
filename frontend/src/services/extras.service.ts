import { fetchApi } from './api'
import { mapExtra, getProjetoExtras } from '@/mappers/projetoExtra.mapper'
import type { ProjetoExtra } from '@/domain/projetoExtra'
import type { ProjetoExtraRaw } from '@/types/projetoExtra.raw'
import { USE_MOCKS } from '@/config/env'

export const ExtrasService = {
  async getAll(): Promise<ProjetoExtra[]> {
    if (USE_MOCKS) return getProjetoExtras()
    try {
      const data = await fetchApi<ProjetoExtraRaw[]>('/projetos-extra/')

      return data.map(mapExtra)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar extras:', error)
      return getProjetoExtras()
    }
  },

  async getByProjetoId(projetoId: string): Promise<ProjetoExtra[]> {
    const all = await this.getAll()
    return all.filter(ex => ex.projetoId === projetoId)
  }
}
