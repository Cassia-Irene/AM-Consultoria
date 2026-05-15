import { fetchApi } from './api'

export interface EventoCritico {
  id_evento: number
  id_contrato: number
  data_evento: string
  descricao: string
  acao_tomada?: string
}

export const EventosService = {
  async getByContratoId(contratoId: string | number): Promise<EventoCritico[]> {
    try {
      const all = await fetchApi<EventoCritico[]>('/eventos-criticos/')
      return all.filter(e => String(e.id_contrato) === String(contratoId))
    } catch (err) {
      console.error('[SERVICE][EVENTO] Erro ao buscar:', err)
      return []
    }
  }
}
