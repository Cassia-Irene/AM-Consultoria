// src/mappers/contrato.mapper.ts

import { Contratos as ContratosMock } from '@/lib/mocks'
import type { Contrato } from '@/domain/contrato'
import type { ContratoRaw } from '@/types/contrato.raw'

export function getContratos(): Contrato[] {
  return (ContratosMock as ContratoRaw[]).map(mapContrato)
}

export function mapContrato(raw: ContratoRaw): Contrato {
  const clienteId = raw.clienteId || raw.cliente
  if (!clienteId) throw new Error(`ContratoRaw (ID: ${raw.id}) missing required field: clienteId`)

  return {
    id: String(raw.id),
    clienteId: String(clienteId),

    status: normalizeStatusContrato(raw.status),

    tipo_cobranca: raw.tipo_cobranca || 'Mensalidade',
    valorMensal: raw.valorMensal ?? 0,
    visitas_previstas_mes: raw.visitas_previstas_mes || 1,
    valor_visita_extra: raw.valor_visita_extra,
    
    inclui_relatorio: raw.inclui_relatorio ?? false,
    data_inicio: raw.data_inicio || '2026-01-01',
    data_fim: raw.data_fim,

    faturamento: {
      status: normalizeStatusFaturamento(raw.faturamentoMes?.status),
      valor: raw.faturamentoMes?.valor ?? 0,
      vencimento: raw.faturamentoMes?.vencimento,
    },

    motivo_alteracao: raw.motivo_alteracao,
    observacoes: raw.observacoes,

    criadoEm: raw.criadoEm ?? new Date().toISOString(),
  }
}

/* ───────── helpers ───────── */

function normalizeStatusContrato(
  status?: string
): 'ativo' | 'inativo' {
  if (status === 'ativo') return 'ativo'
  if (status === 'inativo') return 'inativo'

  console.warn('Status contrato desconhecido:', status)
  return 'ativo'
}

function normalizeStatusFaturamento(
  status?: string
): 'pago' | 'pendente' | 'atrasado' {
  if (status === 'pago') return 'pago'
  if (status === 'pendente') return 'pendente'
  if (status === 'atrasado') return 'atrasado'

  console.warn('Status faturamento desconhecido:', status)
  return 'pendente'
}