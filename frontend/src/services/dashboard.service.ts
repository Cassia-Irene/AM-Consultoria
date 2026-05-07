// src/services/dashboard.service.ts
//
// Orquestra os dados do dashboard a partir dos mappers.
// faturamentos é entidade separada — NÃO vem de contrato.faturamento.

import type { Pendencia } from '@/domain/pendencia'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Visita } from '@/domain/visita'
import type { Projeto } from '@/domain/projeto'

import { getPendencias } from '@/mappers/pendencia.mapper'
import { getClientes } from '@/mappers/cliente.mapper'
import { getContratos } from '@/mappers/contrato.mapper'
import { getFaturamentos } from '@/mappers/faturamento.mapper'
import { getVisitas } from '@/mappers/visita.mapper'
import { getProjetos } from '@/mappers/projeto.mapper'

import { safeArray } from '@/utils/safe'
import { fetchApi } from './api'

export interface DashboardResponse {
  pendencias: Pendencia[]
  clientes: Pick<Cliente, 'id' | 'nome_instituicao'>[]
  contratos: Contrato[]
  faturamentos: FaturamentoCliente[]
  visitas: Visita[]
  projetos: Projeto[]
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardResponse> {
    try {
      const [pendencias, clientes, contratos, faturamentos, visitas, projetos] = await Promise.all([
        fetchApi<Pendencia[]>('/pendencias', undefined, getPendencias()),
        fetchApi<Pick<Cliente, 'id' | 'nome_instituicao'>[]>('/clientes', undefined, getClientes().map(c => ({ id: c.id, nome_instituicao: c.nome_instituicao }))),
        fetchApi<Contrato[]>('/contratos', undefined, getContratos()),
        fetchApi<FaturamentoCliente[]>('/faturamento-cliente', undefined, getFaturamentos()),
        fetchApi<Visita[]>('/visitas?hoje=true', undefined, getVisitas()),
        fetchApi<Projeto[]>('/projetos', undefined, getProjetos()),
      ])

      return {
        pendencias: safeArray(pendencias),
        clientes: safeArray(clientes),
        contratos: safeArray(contratos),
        faturamentos: safeArray(faturamentos),
        visitas: safeArray(visitas),
        projetos: safeArray(projetos),
      }
    } catch (err) {
      console.warn('[WARN][DASHBOARD] Fallback ativado. Erro ao carregar dados:', err)
      return {
        pendencias: [],
        clientes: [],
        contratos: [],
        faturamentos: [],
        visitas: [],
        projetos: [],
      }
    }
  }
}
