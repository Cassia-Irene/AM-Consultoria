// src/services/clientes.service.ts
import { fetchApi } from './api'
import { mapCliente } from '@/mappers/cliente.mapper'
import type { Cliente } from '@/domain/cliente'
import type { ClienteRaw } from '@/types/cliente.raw'
import { Clientes as ClientesMock } from '@/mocks/clientes'
import { USE_MOCKS } from '@/config/env'

export const ClientesService = {
  async getAll(): Promise<Cliente[]> {
    if (USE_MOCKS) {
      console.log('[SERVICE] Usando mocks para Clientes')
      return (ClientesMock as unknown as ClienteRaw[]).map(mapCliente)
    }

    try {
      const data = await fetchApi<ClienteRaw[]>('/clientes/')
      return data.map(mapCliente)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar clientes da API:', error)
      // Fallback de segurança para não quebrar a UI
      return (ClientesMock as unknown as ClienteRaw[]).map(mapCliente)
    }
  },

  async getById(id: string): Promise<Cliente | null> {
    if (USE_MOCKS) {
      const mock = ClientesMock.find(c => c.id === id)
      return mock ? mapCliente(mock as unknown as ClienteRaw) : null
    }

    try {
      const data = await fetchApi<ClienteRaw>(`/clientes/${id}`)
      return mapCliente(data)
    } catch (error) {
      console.error(`[SERVICE][ERROR] Falha ao buscar cliente ${id}:`, error)
      const mock = ClientesMock.find(c => c.id === id)
      return mock ? mapCliente(mock as unknown as ClienteRaw) : null
    }
  }
}
