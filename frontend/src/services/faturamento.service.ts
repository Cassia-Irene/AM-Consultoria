import { fetchApi } from './api'
import { mapFaturamento } from '@/mappers/faturamento.mapper'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { FaturamentoRaw } from '@/types/faturamento.raw'

export const FaturamentosService = {
  async getAll(contratoId?: string): Promise<FaturamentoCliente[]> {
    try {
      const url = contratoId ? `/faturamento-cliente/?id_contrato=${contratoId}` : '/faturamento-cliente/'
      const data = await fetchApi<FaturamentoRaw[]>(url)
      return data.map(mapFaturamento)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar faturamentos:', error)
      throw error // Erro explícito
    }
  },

  async getByContratoIds(contratoIds: string[]): Promise<FaturamentoCliente[]> {
    const all = await this.getAll()
    return all.filter(f => contratoIds.includes(f.contratoId))
  },

  async update(
    id: string,
    payload: {
      pago?: boolean
      data_pagamento?: string | null
      desconto?: number
      valor_total?: number
    }
  ): Promise<FaturamentoCliente> {
    try {
      const rawPayload: Record<string, unknown> = {}
      if (payload.pago !== undefined) rawPayload.pago = payload.pago
      if (payload.data_pagamento !== undefined) rawPayload.data_pagamento = payload.data_pagamento
      if (payload.desconto !== undefined) rawPayload.desconto = payload.desconto
      if (payload.valor_total !== undefined) rawPayload.valor_total = payload.valor_total

      const raw = await fetchApi<FaturamentoRaw>(`/faturamento-cliente/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawPayload)
      })
      return mapFaturamento(raw)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao atualizar faturamento:', error)
      throw error
    }
  },

  async create(contratoId: string | number, mesAno: string): Promise<FaturamentoCliente> {
    try {
      const raw = await fetchApi<FaturamentoRaw>('/faturamento-cliente/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_contrato: Number(contratoId),
          mes_ano: mesAno, // "YYYY-MM-01"
          visitas_realizadas: 0,
          desconto: 0,
          pago: false,
          data_pagamento: null
        })
      })
      return mapFaturamento(raw)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao criar faturamento:', error)
      throw error
    }
  }
}
