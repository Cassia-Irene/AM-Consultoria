// src/services/contrato.service.ts
//
// Orquestra os dados para a página de detalhes do contrato.
// Consome múltiplos mappers para compor a visão 360 do contrato.

import { mapContrato, mapHistorico } from '@/mappers/contrato.mapper'
import { mapFaturamento } from '@/mappers/faturamento.mapper'
import { mapVisita } from '@/mappers/visita.mapper'
import { mapCliente } from '@/mappers/cliente.mapper'
import { getFaturamentoMaisRecente } from '@/domain/faturamento'
import { fetchApi } from './api'
import type { Contrato, HistoricoContrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Visita } from '@/domain/visita'
import type { Cliente } from '@/domain/cliente'
import type { ContratoRaw, HistoricoContratoRaw } from '@/types/contrato.raw'
import type { FaturamentoRaw } from '@/types/faturamento.raw'
import type { VisitaRaw } from '@/types/visita.raw'
import type { ClienteRaw } from '@/types/cliente.raw'
import { toReplacePayload, type ReplaceContratoInput } from '@/adapters/contrato.adapter'

export interface ContratoDetail {
  contrato: Contrato
  cliente: Cliente
  faturamentoAtual?: FaturamentoCliente
  visitas: Visita[]
  historicos: HistoricoContrato[]
  todosContratos: Contrato[]
}

export const ContratoService = {
  async getAll(): Promise<Contrato[]> {
    try {
      const data = await fetchApi<ContratoRaw[]>('/contratos/')
      return data.map(mapContrato)
    } catch (err) {
      console.error('[SERVICE][CONTRATO] Erro ao buscar todos:', err)
      throw err 
    }
  },

  async getByClienteId(clienteId: string): Promise<Contrato[]> {
    const all = await this.getAll()
    return all.filter(c => c.clienteId === clienteId)
  },

  async getContratoDetail(id: string): Promise<ContratoDetail | null> {
    try {
      const [contratos, faturamentos, visitas, clientes, historicos] = await Promise.all([
        this.getAll(),
        fetchApi<FaturamentoRaw[]>('/faturamento-cliente/').then(data => data.map(mapFaturamento)),
        fetchApi<VisitaRaw[]>('/visitas/').then(data => data.map(mapVisita)),
        fetchApi<ClienteRaw[]>('/clientes/').then(data => data.map(mapCliente)),
        fetchApi<HistoricoContratoRaw[]>('/contratos/historico/').then(data => data.map(mapHistorico))
      ])

      const contrato = contratos.find(c => c.id === id)
      if (!contrato) return null

      const cliente = clientes.find(c => c.id === contrato.clienteId)
      
      const faturamentoAtual = getFaturamentoMaisRecente(faturamentos, id)
      const visitasDoContrato = visitas
        .filter(v => v.contratoId === id)
        .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())

      return {
        contrato,
        cliente: cliente || { 
          id: contrato.clienteId, 
          nome_instituicao: `Cliente ${contrato.clienteId}`, 
          tipo_instituicao: 'Não informada', 
          cidade: 'Não informada', 
          nivel_complexidade: 'baixa', 
          status: 'ativo' 
        },
        faturamentoAtual,
        visitas: visitasDoContrato,
        historicos,
        todosContratos: contratos
      }
    } catch (err) {
      console.error('[ERROR][CONTRATO_SERVICE] Falha ao compor detalhes do contrato:', err)
      throw err
    }
  },

  async replace(input: ReplaceContratoInput): Promise<Contrato> {
    const payload = toReplacePayload(input)
    const raw = await fetchApi<ContratoRaw>('/contratos/replace', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return mapContrato(raw)
  }
}
