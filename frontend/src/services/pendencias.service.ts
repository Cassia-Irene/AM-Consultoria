import { fetchApi } from './api'
import { mapPendencia, getPendencias } from '@/mappers/pendencia.mapper'
import type { Pendencia } from '@/domain/pendencia'
import type { PendenciaRaw } from '@/types/pendencia.raw'
import { USE_MOCKS } from '@/config/env'

export interface NovaPendenciaInput {
  contratoId: string
  visitaId?: string
  descricao: string
  responsavel: string
  data_prazo?: string
  resolvida?: boolean
}

export const PendenciasService = {
  async getAll(): Promise<Pendencia[]> {
    if (USE_MOCKS) return getPendencias()
    try {
      const data = await fetchApi<PendenciaRaw[]>('/pendencias/')
      return data.map(mapPendencia)
    } catch (error) {
      console.error('[SERVICE][ERROR] Falha ao buscar pendências:', error)
      return getPendencias()
    }
  },

  async getByContratoId(contratoId: string): Promise<Pendencia[]> {
    const all = await this.getAll()
    return all.filter(p => p.contratoId === contratoId)
  },

  async criar(input: NovaPendenciaInput): Promise<{ id: string }> {
    const payload = {
      id_contrato: Number(input.contratoId),
      id_visita: input.visitaId ? Number(input.visitaId) : null,
      descricao: input.descricao,
      responsavel: input.responsavel,
      data_prazo: input.data_prazo || null,
      resolvida: !!input.resolvida,
      data_resolucao: input.resolvida ? new Date().toISOString().split('T')[0] : null
    }

    if (USE_MOCKS) {
      console.log('[MOCK][PENDENCIA] Criando:', payload)
      return { id: `p-mock-${Math.random()}` }
    }

    return fetchApi<{ id: string }>('/pendencias/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  async atualizar(id: string | number, input: Partial<NovaPendenciaInput>): Promise<void> {
    const payload: Record<string, string | number | boolean | null | undefined> = {}
    if (input.descricao !== undefined) payload.descricao = input.descricao
    if (input.responsavel !== undefined) payload.responsavel = input.responsavel
    if (input.data_prazo !== undefined) payload.data_prazo = input.data_prazo
    if (input.resolvida !== undefined) {
      payload.resolvida = input.resolvida
      if (input.resolvida) payload.data_resolucao = new Date().toISOString().split('T')[0]
      else payload.data_resolucao = null
    }

    if (USE_MOCKS) {
      console.log(`[MOCK][PENDENCIA] Atualizando ${id}:`, payload)
      return
    }

    await fetchApi(`/pendencias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
  },

  async excluir(id: string | number): Promise<void> {
    if (USE_MOCKS) {
      console.log(`[MOCK][PENDENCIA] Excluindo ${id}`)
      return
    }

    await fetchApi(`/pendencias/${id}`, {
      method: 'DELETE'
    })
  }
}


