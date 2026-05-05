// src/services/contrato.service.ts
//
// Orquestra os dados para a página de detalhes do contrato.
// Consome múltiplos mappers para compor a visão 360 do contrato.

import { getContratos } from '@/mappers/contrato.mapper'
import { getFaturamentos } from '@/mappers/faturamento.mapper'
import { getVisitas } from '@/mappers/visita.mapper'
import { getClientes } from '@/mappers/cliente.mapper'
import { getFaturamentoMaisRecente } from '@/domain/faturamento'
import { fetchApi } from './api'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Visita } from '@/domain/visita'
import type { Cliente } from '@/domain/cliente'

export interface ContratoDetail {
  contrato: Contrato
  cliente: Cliente
  faturamentoAtual?: FaturamentoCliente
  visitas: Visita[]
}

export const ContratoService = {
  async getContratoDetail(id: string): Promise<ContratoDetail | null> {
    try {
      const [contratos, faturamentos, visitas, clientes] = await Promise.all([
        fetchApi<Contrato[]>('/contratos', undefined, getContratos()),
        fetchApi<FaturamentoCliente[]>('/faturamento-cliente', undefined, getFaturamentos()),
        fetchApi<Visita[]>('/visitas', undefined, getVisitas()),
        fetchApi<Cliente[]>('/clientes', undefined, getClientes())
      ])

      const contrato = contratos.find(c => c.id === id)
      if (!contrato) return null

      const cliente = clientes.find(c => c.id === contrato.clienteId)
      if (!cliente) {
        console.warn(`[WARN][CONTRATO_SERVICE] Cliente ${contrato.clienteId} não encontrado para o contrato ${id}`)
      }

      const faturamentoAtual = getFaturamentoMaisRecente(faturamentos, id)
      const visitasDoContrato = visitas
        .filter(v => v.contratoId === id)
        .sort((a, b) => new Date(b.data_visita).getTime() - new Date(a.data_visita).getTime())

      return {
        contrato,
        cliente: cliente || { id: contrato.clienteId, nome_instituicao: `Cliente ${contrato.clienteId}`, tipo_instituicao: 'Não informada', cidade: 'Não informada', nivel_complexidade: 'baixa', status: 'ativo' },
        faturamentoAtual,
        visitas: visitasDoContrato
      }
    } catch (err) {
      console.error('[ERROR][CONTRATO_SERVICE] Falha ao compor detalhes do contrato:', err)
      throw err
    }
  },

  async replace(input: {
    contratoId: string
    novoValorMensal: number
    visitas: number
    motivo: string
  }): Promise<Contrato> {
    return fetchApi<Contrato>('/contratos/replace', {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: Number(input.contratoId),
        novo_valor_mensal: input.novoValorMensal,
        visitas_previstas_mes: input.visitas,
        motivo_alteracao: input.motivo
      })
    })
  }
}
