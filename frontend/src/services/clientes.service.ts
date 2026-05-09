// src/services/clientes.service.ts
import { fetchApi } from './api'
import { mapCliente } from '@/mappers/cliente.mapper'
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
      throw error // Não cai mais para mock silencioso
    }
  }
}
