import { fetchApi } from './api'
import { mapProjeto } from '@/mappers/projeto.mapper'
import type { Projeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'

export const ProjetosService = {
  async getAll(): Promise<Projeto[]> {
    try {
      const data = await fetchApi<ProjetoRaw[]>('/projetos/', { cache: 'no-store' })
      return data.map(mapProjeto)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar projetos:', error)
      throw error // Não cai mais para mock silencioso
    }
  },

  async getByContratoIds(contratoIds: string[]): Promise<Projeto[]> {
    const all = await this.getAll()
    return all.filter(p => contratoIds.includes(p.contratoId))
  },

  async getById(id: string): Promise<Projeto | null> {
    try {
      const data = await fetchApi<ProjetoRaw>(`/projetos/${id}`)
      return mapProjeto(data)
    } catch (error) {
       console.error(`[SERVICE][ERROR] Falha ao buscar projeto ${id}:`, error)
       throw error
    }
  }
}
