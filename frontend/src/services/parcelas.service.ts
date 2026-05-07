import { fetchApi } from './api'
import { mapParcela, getProjetoParcelas } from '@/mappers/projetoParcela.mapper'
import type { ProjetoParcela } from '@/domain/projetoParcela'
import type { ProjetoParcelaRaw } from '@/types/projetoParcela.raw'
import { USE_MOCKS } from '@/config/env'

export const ParcelasService = {
  async getAll(): Promise<ProjetoParcela[]> {
    if (USE_MOCKS) return getProjetoParcelas()
    try {
      const data = await fetchApi<ProjetoParcelaRaw[]>('/projeto-parcelas/')
      return data.map(mapParcela)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar parcelas:', error)
      return getProjetoParcelas()
    }
  },

  async getByProjetoId(projetoId: string): Promise<ProjetoParcela[]> {
    const all = await this.getAll()
    return all.filter(p => p.projetoId === projetoId)
  }
}
