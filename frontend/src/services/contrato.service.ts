// src/services/contrato.service.ts
//
// Orquestra os dados para a página de detalhes do contrato.
// Consome múltiplos mappers para compor a visão 360 do contrato.

import { mapContrato, mapHistorico } from '@/mappers/contrato.mapper'

import { mapVisita } from '@/mappers/visita.mapper'
import { mapCliente } from '@/mappers/cliente.mapper'
import { getFaturamentoMaisRecente } from '@/domain/faturamento'
import { FaturamentosService } from './faturamento.service'
import { fetchApi } from './api'
import type { Contrato, HistoricoContrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Visita } from '@/domain/visita'
import type { Cliente } from '@/domain/cliente'
import type { ContratoRaw, HistoricoContratoRaw } from '@/types/contrato.raw'

import type { VisitaRaw } from '@/types/visita.raw'
import type { ClienteRaw } from '@/types/cliente.raw'
import { 
  toReplacePayload, 
  toCreatePayload, 
  toPatchPayload, 
  type ReplaceContratoInput, 
  type CreateContratoInput, 
  type PatchContratoInput 
} from '@/adapters/contrato.adapter'

export interface ContratoPagamentoRaw {
  id: number | string
  id_contrato: number | string
  id_tipo_pagamento: number | string
  valor: number | string
}

export interface TipoPagamentoRaw {
  id_tipo: number | string
  tipo: string
}

export interface ContratoDetail {
  contrato: Contrato
  cliente: Cliente
  faturamentoAtual?: FaturamentoCliente
  todosFaturamentos: FaturamentoCliente[]
  visitas: Visita[]
  historicos: HistoricoContrato[]
  todosContratos: Contrato[]
  pagamentos?: Array<{ id: number; valor: number; tipo: string }>
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
      // 1. Busca o contrato específico primeiro via ID dedicado para validar sua existência rapidamente
      const contratoRaw = await fetchApi<ContratoRaw>(`/contratos/${id}`)
      if (!contratoRaw) return null
      const contrato = mapContrato(contratoRaw)

      // 2. Busca de forma concorrente apenas os dados de suporte necessários para a visualização
      const [clienteRaw, faturamentos, visitas, todosContratosRaw, historicos, pagamentosRaw, tiposRaw] = await Promise.all([
        fetchApi<ClienteRaw>(`/clientes/${contrato.clienteId}`),
        FaturamentosService.getAll(id),
        fetchApi<VisitaRaw[]>('/visitas/').then(data => data.map(mapVisita)),
        fetchApi<ContratoRaw[]>('/contratos/'),
        fetchApi<HistoricoContratoRaw[]>('/contratos/historico').then(data => data.map(mapHistorico)),
        fetchApi<ContratoPagamentoRaw[]>('/contrato-pagamento/').catch(() => []),
        fetchApi<TipoPagamentoRaw[]>('/tipos-pagamento/').catch(() => [])
      ])

      const cliente = mapCliente(clienteRaw)
      const todosContratos = todosContratosRaw.map(mapContrato)
      const faturamentoAtual = getFaturamentoMaisRecente(faturamentos, id)
      const visitasDoContrato = visitas
        .filter(v => v.contratoId === id)
        .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())

      const pagamentosMapped = (pagamentosRaw || [])
        .filter((p: ContratoPagamentoRaw) => String(p.id_contrato) === String(id))
        .map((p: ContratoPagamentoRaw) => {
          const tipoObj = (tiposRaw || []).find((t: TipoPagamentoRaw) => t.id_tipo === p.id_tipo_pagamento)
          return {
            id: Number(p.id),
            valor: Number(p.valor || 0),
            tipo: tipoObj ? String(tipoObj.tipo) : 'Desconhecido'
          }
        })

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
        todosFaturamentos: faturamentos,
        visitas: visitasDoContrato,
        historicos,
        todosContratos,
        pagamentos: pagamentosMapped
      }
    } catch (err) {
      console.error('[ERROR][CONTRATO_SERVICE] Falha ao compor detalhes do contrato:', err)
      return null
    }
  },

  async replace(input: ReplaceContratoInput): Promise<Contrato> {
    const payload = toReplacePayload(input)
    const raw = await fetchApi<ContratoRaw>('/contratos/replace', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return mapContrato(raw)
  },

  async create(input: CreateContratoInput): Promise<Contrato> {
    try {
      // 1. Cria o contrato principal
      const payloadContrato = toCreatePayload(input)
      const rawContrato = await fetchApi<ContratoRaw>('/contratos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadContrato)
      })
      const contrato = mapContrato(rawContrato)

      // 2. Se houver valor mensal especificado, tenta associar o pagamento
      if (input.valorMensal > 0 && contrato.id) {
        try {
          await fetchApi('/contrato-pagamento/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_contrato: Number(contrato.id),
              id_tipo_pagamento: 1, // Mensalidade por padrão
              valor: input.valorMensal
            })
          })
        } catch (payErr) {
          // Diretriz 1: Desacoplamento parcial de pagamento para evitar rollback do contrato se a rede de pagamento falhar!
          console.warn('[CONTRATO_SERVICE] Contrato criado com sucesso, mas falhou ao vincular pagamento mensal recorrente:', payErr)
        }
      }

      return contrato
    } catch (err) {
      console.error('[SERVICE][CONTRATO] Erro ao criar contrato:', err)
      throw err
    }
  },

  async patch(input: PatchContratoInput): Promise<Contrato> {
    try {
      const payload = toPatchPayload(input)
      const raw = await fetchApi<ContratoRaw>(`/contratos/${input.contratoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      return mapContrato(raw)
    } catch (err) {
      console.error('[SERVICE][CONTRATO] Erro ao aplicar edição administrativa PATCH:', err)
      throw err
    }
  },

  formatarPagamentos(pagamentos?: Array<{ id: number; valor: number; tipo: string }>): string {
    if (!pagamentos || pagamentos.length === 0) return ''
    return pagamentos
      .map(p => `${p.tipo}: ${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
      .join(' + ')
  }
}
