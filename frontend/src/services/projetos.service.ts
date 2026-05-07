import { fetchApi } from './api'
import { mapProjeto, getProjetos } from '@/mappers/projeto.mapper'
import type { Projeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'
import { USE_MOCKS } from '@/config/env'

export const ProjetosService = {
  async getAll(): Promise<Projeto[]> {
    if (USE_MOCKS) return getProjetos()
    try {
      const data = await fetchApi<ProjetoRaw[]>('/projetos/')
      return data.map(mapProjeto)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar projetos:', error)
      return getProjetos()
    }
  },

  async getByContratoIds(contratoIds: string[]): Promise<Projeto[]> {
    const all = await this.getAll()
    return all.filter(p => contratoIds.includes(p.contratoId))
  },

  async getById(id: string): Promise<Projeto | null> {
    const all = await this.getAll()
    return all.find(p => p.id === id) || null
  }
}
