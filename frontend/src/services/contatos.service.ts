import { fetchApi } from './api'
import { mapContato, getContatos } from '@/mappers/contato.mapper'
import type { Contato } from '@/domain/contato'
import type { ContatoRaw } from '@/types/contato.raw'
import { USE_MOCKS } from '@/config/env'

export const ContatosService = {
  async getAll(): Promise<Contato[]> {
    if (USE_MOCKS) return getContatos()
    try {
      const data = await fetchApi<ContatoRaw[]>('/contatos/')
      return data.map(mapContato)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar contatos:', error)
      return getContatos()
    }
  },

  async getByClienteId(clienteId: string): Promise<Contato[]> {
    const all = await this.getAll()
    return all.filter(c => c.clienteId === clienteId)
  }
}
