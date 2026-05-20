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
    if (USE_MOCKS) {
       const all = await this.getAll()
       return all.filter(c => c.clienteId === clienteId)
    }
    try {
      const data = await fetchApi<ContatoRaw[]>('/contatos/') // Idealmente teríamos /clientes/{id}/contatos
      return data.filter(r => String(r.id_cliente) === clienteId).map(mapContato)
    } catch (error) {
      console.error(`[SERVICE][ERROR] Falha ao buscar contatos do cliente ${clienteId}:`, error)
      return []
    }
  },

  async create(data: Partial<ContatoRaw>): Promise<Contato> {
    const raw = await fetchApi<ContatoRaw>('/contatos/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return mapContato(raw)
  },

  async update(id: string, data: Partial<ContatoRaw>): Promise<Contato> {
    const raw = await fetchApi<ContatoRaw>(`/contatos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    return mapContato(raw)
  }
}
