import { fetchApi } from './api'
import { mapProjeto } from '@/mappers/projeto.mapper'
import type { Projeto } from '@/domain/projeto'
import type { ProjetoRaw } from '@/types/projeto.raw'
import { Projetos as MOCK_PROJETOS } from '@/mocks/projetos'

import { AuditEntry } from '@/types/audit'

export type { AuditEntry }

export const ProjetosService = {
  async getAll(): Promise<Projeto[]> {
    try {
      const data = await fetchApi<ProjetoRaw[]>('/projetos/', { cache: 'no-store' }, MOCK_PROJETOS as ProjetoRaw[])
      return data.map(mapProjeto)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar projetos:', error)
      throw error
    }
  },

  async getByContratoIds(contratoIds: string[]): Promise<Projeto[]> {
    const all = await this.getAll()
    return all.filter(p => contratoIds.includes(p.contratoId))
  },

  async getById(id: string): Promise<Projeto | null> {
    try {
      const fallback = MOCK_PROJETOS.find(p => String(p.id_projeto) === id) || MOCK_PROJETOS[0]
      const data = await fetchApi<ProjetoRaw>(`/projetos/${id}`, {}, fallback as ProjetoRaw)
      return mapProjeto(data)
    } catch (error) {
       console.error(`[SERVICE][ERROR] Falha ao buscar projeto ${id}:`, error)
       throw error
    }
  },

  async create(projeto: Partial<ProjetoRaw>): Promise<Projeto> {
    const data = await fetchApi<ProjetoRaw>('/projetos/', {
      method: 'POST',
      body: JSON.stringify(projeto)
    })
    return mapProjeto(data)
  },

  async update(id: string, updates: Partial<ProjetoRaw>): Promise<Projeto> {
    const data = await fetchApi<ProjetoRaw>(`/projetos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    return mapProjeto(data)
  },
  
  async getAuditoria(id: string): Promise<AuditEntry[]> {
    try {
      return await fetchApi<AuditEntry[]>(`/projetos/${id}/auditoria`, { cache: 'no-store' }, [])
    } catch (error) {
      console.error(`[SERVICE][ERROR] Falha ao buscar auditoria do projeto ${id}:`, error)
      return []
    }
  },

  async deleteAuditoria(id: string, timestamp: string): Promise<boolean> {
    try {
      await fetchApi(`/projetos/${id}/auditoria/${encodeURIComponent(timestamp)}`, { method: 'DELETE' })
      return true
    } catch (error) {
      console.error(`[SERVICE][ERROR] Falha ao deletar registro de auditoria do projeto ${id}:`, error)
      return false
    }
  }
}
