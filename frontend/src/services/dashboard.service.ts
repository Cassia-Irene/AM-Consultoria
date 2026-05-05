// src/services/dashboard.service.ts

import { fetchApi } from './api'
import type { Pendencia } from '@/domain/pendencia'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { Visita } from '@/domain/visita'

import { getPendencias } from '@/mappers/pendencia.mapper'
import { getClientes } from '@/mappers/cliente.mapper'
import { getContratos } from '@/mappers/contrato.mapper'
import { getVisitas } from '@/mappers/visita.mapper'

export interface DashboardResponse {
  pendencias: Pendencia[]
  clientes: Pick<Cliente, 'id' | 'nome_instituicao'>[]
  contratos: Pick<Contrato, 'id' | 'clienteId' | 'faturamento'>[]
  visitas: Visita[]
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardResponse> {
    // Para transição suave, simulamos a resposta da API usando os mappers/mocks atuais
    // const response = await fetchApi<DashboardResponse>('/dashboard')
    // return response

    console.log('[API GET /dashboard] Fetching data...')
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      pendencias: getPendencias(),
      clientes: getClientes().map(c => ({ id: c.id, nome_instituicao: c.nome_instituicao })),
      contratos: getContratos().map(c => ({ id: c.id, clienteId: c.clienteId, faturamento: c.faturamento })),
      visitas: getVisitas()
    }
  }
}
