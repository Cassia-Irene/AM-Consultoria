import { fetchApi } from './api'

export interface EntregaRaw {
  id_entrega: number
  id_projeto: number
  descricao: string
  data_entrega_prevista: string
  data_entrega_real?: string | null
  entregue: boolean
  referencia_doc?: string | null
}

export const EntregasService = {
  async getAll(): Promise<EntregaRaw[]> {
    return await fetchApi<EntregaRaw[]>('/entregas/')
  },
  
  async getById(id: number | string): Promise<EntregaRaw> {
    return await fetchApi<EntregaRaw>(`/entregas/${id}`)
  },

  async getByProjetoId(projetoId: string | number): Promise<EntregaRaw[]> {
    const all = await this.getAll()
    return all.filter(e => String(e.id_projeto) === String(projetoId))
  },

  async create(entrega: Partial<EntregaRaw>): Promise<EntregaRaw> {
    return await fetchApi<EntregaRaw>('/entregas/', {
      method: 'POST',
      body: JSON.stringify(entrega)
    })
  },

  async update(id: number, updates: Partial<EntregaRaw>): Promise<EntregaRaw> {
    return await fetchApi<EntregaRaw>(`/entregas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  },

  async delete(id: number): Promise<void> {
    await fetchApi(`/entregas/${id}`, {
      method: 'DELETE'
    })
  }
}
