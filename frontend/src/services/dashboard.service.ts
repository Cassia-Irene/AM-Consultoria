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

import { safeArray } from '@/utils/safe'
import { fetchApi } from './api'

export interface DashboardResponse {
  pendencias: Pendencia[]
  clientes: Pick<Cliente, 'id' | 'nome_instituicao'>[]
  contratos: Pick<Contrato, 'id' | 'clienteId'>[]
  faturamentos: FaturamentoCliente[]
  visitas: Visita[]
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardResponse> {
    try {
      const [pendencias, clientes, contratos, faturamentos, visitas] = await Promise.all([
        fetchApi<Pendencia[]>('/pendencias', undefined, getPendencias()),
        fetchApi<Pick<Cliente, 'id' | 'nome_instituicao'>[]>('/clientes', undefined, getClientes().map(c => ({ id: c.id, nome_instituicao: c.nome_instituicao }))),
        fetchApi<Pick<Contrato, 'id' | 'clienteId'>[]>('/contratos', undefined, getContratos().map(c => ({ id: c.id, clienteId: c.clienteId }))),
        fetchApi<FaturamentoCliente[]>('/faturamento-cliente?mes=2026-05', undefined, getFaturamentos()),
        fetchApi<Visita[]>('/visitas?hoje=true', undefined, getVisitas()),
      ])

      return {
        pendencias: safeArray(pendencias),
        clientes: safeArray(clientes),
        contratos: safeArray(contratos),
        faturamentos: safeArray(faturamentos),
        visitas: safeArray(visitas),
      }
    } catch (err) {
      console.warn('[WARN][DASHBOARD] Fallback ativado. Erro ao carregar dados:', err)
      return {
        pendencias: [],
        clientes: [],
        contratos: [],
        faturamentos: [],
        visitas: [],
      }
    }
  }
}
