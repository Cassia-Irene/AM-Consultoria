// src/services/dashboard.service.ts
//
// Orquestra os dados do dashboard a partir dos mappers.
// faturamentos é entidade separada — NÃO vem de contrato.faturamento.

import type { Pendencia } from '@/domain/pendencia'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Visita } from '@/domain/visita'

import { getPendencias } from '@/mappers/pendencia.mapper'
import { getClientes } from '@/mappers/cliente.mapper'
import { getContratos } from '@/mappers/contrato.mapper'
import { getFaturamentos } from '@/mappers/faturamento.mapper'
import { getVisitas } from '@/mappers/visita.mapper'

export interface DashboardResponse {
  pendencias: Pendencia[]
  clientes: Pick<Cliente, 'id' | 'nome_instituicao'>[]
  contratos: Pick<Contrato, 'id' | 'clienteId'>[]
  faturamentos: FaturamentoCliente[]
  visitas: Visita[]
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardResponse> {
    // TODO: substituir por chamadas reais à API
    // const [pendencias, clientes, contratos, faturamentos, visitas] = await Promise.all([
    //   fetchApi<Pendencia[]>('/pendencias'),
    //   fetchApi<Cliente[]>('/clientes'),
    //   fetchApi<Contrato[]>('/contratos'),
    //   fetchApi<FaturamentoCliente[]>('/faturamento-cliente?mes=2026-05'),
    //   fetchApi<Visita[]>('/visitas?hoje=true'),
    // ])

    console.log('[DashboardService] Carregando dados dos mocks...')
    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      pendencias: getPendencias(),
      clientes: getClientes().map(c => ({ id: c.id, nome_instituicao: c.nome_instituicao })),
      contratos: getContratos().map(c => ({ id: c.id, clienteId: c.clienteId })),
      faturamentos: getFaturamentos(),
      visitas: getVisitas(),
    }
  }
}
