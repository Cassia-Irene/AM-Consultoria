import { fetchApi } from './api'
import { mapCliente, mapClienteToRaw } from '@/mappers/cliente.mapper'
import type { Cliente } from '@/domain/cliente'
import type { ClienteRaw } from '@/types/cliente.raw'

export const ClientesService = {
  async getAll(): Promise<Cliente[]> {
    try {
      const data = await fetchApi<ClienteRaw[]>('/clientes/')
      return data.map(mapCliente)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar clientes da API:', error)
      throw error // Não cai mais para mock silencioso
    }
  },

  async getById(id: string): Promise<Cliente | null> {
    try {
      const data = await fetchApi<ClienteRaw>(`/clientes/${id}`)
      return mapCliente(data)
    } catch (error) {
      console.error(`[SERVICE][ERROR] Falha ao buscar cliente ${id}:`, error)
      throw error
    }
  },

  async create(data: Partial<Cliente>): Promise<Cliente> {
    const rawInput = mapClienteToRaw(data)
    const raw = await fetchApi<ClienteRaw>('/clientes/', {
      method: 'POST',
      body: JSON.stringify(rawInput)
    })
    return mapCliente(raw)
  },

  async update(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const rawInput = mapClienteToRaw(data)
    const raw = await fetchApi<ClienteRaw>(`/clientes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(rawInput)
    })
    return mapCliente(raw)
  }
}
