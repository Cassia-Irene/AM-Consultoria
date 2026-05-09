import { fetchApi } from './api'
import { mapFaturamento } from '@/mappers/faturamento.mapper'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'

export const FaturamentosService = {
  async getAll(): Promise<FaturamentoCliente[]> {
    try {
      const data = await fetchApi<FaturamentoRaw[]>('/faturamento-cliente/')
      return data.map(mapFaturamento)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar faturamentos:', error)
      throw error // Erro explícito
    }
  },

  async getByContratoIds(contratoIds: string[]): Promise<FaturamentoCliente[]> {
    const all = await this.getAll()
    return all.filter(f => contratoIds.includes(f.contratoId))
  }
}
