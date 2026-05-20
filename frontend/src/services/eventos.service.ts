import { fetchApi } from './api'

export interface EventoCritico {
  id_evento?: number
  id_contrato: number
  id_visita?: number
  data_evento: string
  descricao: string
  acao_tomada?: string
}

export const EventosService = {
  async getAll(): Promise<EventoCritico[]> {
    try {
      return await fetchApi<EventoCritico[]>('/eventos-criticos/')
    } catch (err) {
      console.error('[SERVICE][EVENTO] Erro ao buscar todos:', err)
      return []
    }
  },

  async getByContratoId(contratoId: string | number): Promise<EventoCritico[]> {
    const all = await this.getAll()
    return all.filter(e => String(e.id_contrato) === String(contratoId))
  },

  async getByVisitaId(visitaId: string | number): Promise<EventoCritico | null> {
    const all = await this.getAll()
    return all.find(e => String(e.id_visita) === String(visitaId)) || null
  },

  async create(evento: {
    id_contrato: number
    id_visita?: number
    data_evento: string
    descricao: string
    acao_tomada?: string
  }): Promise<EventoCritico> {
    return fetchApi<EventoCritico>('/eventos-criticos/', {
      method: 'POST',
      body: JSON.stringify(evento)
    })
  },

  async update(id_evento: number | string, updates: Partial<EventoCritico>): Promise<EventoCritico> {
    return fetchApi<EventoCritico>(`/eventos-criticos/${id_evento}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }
}
