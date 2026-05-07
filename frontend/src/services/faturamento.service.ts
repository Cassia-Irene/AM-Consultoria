import { fetchApi } from './api'
import { mapFaturamento, getFaturamentos } from '@/mappers/faturamento.mapper'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import { USE_MOCKS } from '@/config/env'

export const FaturamentosService = {
  async getAll(): Promise<FaturamentoCliente[]> {
    if (USE_MOCKS) return getFaturamentos()
    try {
      const data = await fetchApi<FaturamentoRaw[]>('/faturamento-cliente/')
      return data.map(mapFaturamento)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar faturamentos:', error)
      return getFaturamentos()
    }
  },

  async getByContratoIds(contratoIds: string[]): Promise<FaturamentoCliente[]> {
    const all = await this.getAll()
    return all.filter(f => contratoIds.includes(f.contratoId))
  }
}
