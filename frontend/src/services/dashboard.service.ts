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

import { mapPendencia } from '@/mappers/pendencia.mapper'
import { mapVisita } from '@/mappers/visita.mapper'
import { mapCliente } from '@/mappers/cliente.mapper'
import { mapContrato } from '@/mappers/contrato.mapper'
import { mapFaturamento } from '@/mappers/faturamento.mapper'
import { mapProjeto } from '@/mappers/projeto.mapper'

import { Pendencias as MockPendencias } from '@/mocks/pendencias'
import { Visitas as MockVisitas } from '@/mocks/visitas'
import { Clientes as MockClientes } from '@/mocks/clientes'
import { Contratos as MockContratos } from '@/mocks/contratos'
import { Faturamentos as MockFaturamentos } from '@/mocks/faturamentos'
import { Projetos as MockProjetos } from '@/mocks/projetos'
import type { PendenciaRaw } from '@/types/pendencia.raw'
import type { VisitaRaw } from '@/types/visita.raw'
import type { ClienteRaw } from '@/types/cliente.raw'
import type { ContratoRaw } from '@/types/contrato.raw'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import type { ProjetoRaw } from '@/types/projeto.raw'

import { safeArray } from '@/utils/safe'
import { fetchApi } from './api'

export interface DashboardResponse {
  pendencias: Pendencia[]
  clientes: Cliente[]
  contratos: Contrato[]
  faturamentos: FaturamentoCliente[]
  visitas: Visita[]
  projetos: Projeto[]
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardResponse> {
    try {
      const [pendRaw, cliRaw, conRaw, fatRaw, visRaw, proRaw] = await Promise.all([
        fetchApi<PendenciaRaw[]>('/pendencias/', undefined, (MockPendencias as unknown as PendenciaRaw[])),
        fetchApi<ClienteRaw[]>('/clientes/', undefined, (MockClientes as unknown as ClienteRaw[])),
        fetchApi<ContratoRaw[]>('/contratos/', undefined, (MockContratos as unknown as ContratoRaw[])),
        fetchApi<FaturamentoRaw[]>('/faturamento-cliente/', undefined, (MockFaturamentos as unknown as FaturamentoRaw[])),
        fetchApi<VisitaRaw[]>('/visitas/', undefined, (MockVisitas as unknown as VisitaRaw[])),
        fetchApi<ProjetoRaw[]>('/projetos/', undefined, (MockProjetos as unknown as ProjetoRaw[])),
      ])

      return {
        pendencias: safeArray(pendRaw).map(mapPendencia),
        clientes: safeArray(cliRaw).map(mapCliente),
        contratos: safeArray(conRaw).map(mapContrato),
        faturamentos: safeArray(fatRaw).map(mapFaturamento),
        visitas: safeArray(visRaw).map(mapVisita),
        projetos: safeArray(proRaw).map(mapProjeto),
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
