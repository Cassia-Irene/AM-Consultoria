import { fetchApi } from './api'
import { mapParcela, getProjetoParcelas } from '@/mappers/projetoParcela.mapper'
import type { ProjetoParcela } from '@/domain/projetoParcela'
import type { ProjetoParcelaRaw } from '@/types/projetoParcela.raw'
import { USE_MOCKS } from '@/config/env'

export const ParcelasService = {
  async getAll(): Promise<ProjetoParcela[]> {
    if (USE_MOCKS) return getProjetoParcelas()
    try {
      const data = await fetchApi<ProjetoParcelaRaw[]>('/projeto-parcelas/')
      return data.map(mapParcela)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar parcelas:', error)
      return getProjetoParcelas()
    }
  },

  async getByProjetoId(projetoId: string): Promise<ProjetoParcela[]> {
    const all = await this.getAll()
    return all.filter(p => p.projetoId === projetoId)
  },

  async update(
    id: string | number,
    payload: {
      pago?: boolean
      data_pagamento?: string | null
    }
  ): Promise<ProjetoParcela> {
    if (USE_MOCKS) {
      console.log(`[MOCK] Atualizando parcela ${id}:`, payload)
      return {
        id: String(id),
        projetoId: 'mock-proj',
        numero_parcela: 1,
        valor_parcela: 1000,
        data_pagamento_prevista: new Date().toISOString(),
        data_pagamento: payload.data_pagamento || undefined,
        pago: !!payload.pago
      }
    }
    try {
      const raw = await fetchApi<ProjetoParcelaRaw>(`/projeto-parcelas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pago: payload.pago,
          data_pagamento: payload.data_pagamento
        })
      })
      return mapParcela(raw)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao atualizar parcela:', error)
      throw error
    }
  }
}
