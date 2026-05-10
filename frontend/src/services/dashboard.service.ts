// src/services/dashboard.service.ts
//
// Agora focado apenas em orquestrar as chamadas de Analytics consolidadas.

import { fetchApi } from './api'
import { mapCliente } from '@/mappers/cliente.mapper'
import { mapContrato } from '@/mappers/contrato.mapper'
import type { ClienteRaw } from '@/types/cliente.raw'
import type { ContratoRaw } from '@/types/contrato.raw'

export const DashboardService = {
  /**
   * Mantém busca de dados brutos apenas para páginas que exigem listas completas
   * (ex: listagem de clientes). O Dashboard Home agora usa AnalyticsService.
   */
  async getBaseData() {
    const [cliRaw, conRaw] = await Promise.all([
      fetchApi<ClienteRaw[]>('/clientes/'),
      fetchApi<ContratoRaw[]>('/contratos/')
    ])

    return {
      clientes: cliRaw.map(mapCliente),
      contratos: conRaw.map(mapContrato)
    }
  }
}
