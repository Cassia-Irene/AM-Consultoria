// src/mappers/contrato.mapper.ts

import { Contratos as ContratosMock } from '@/lib/mocks'
import type { Contrato } from '@/domain/contrato'
import type { ContratoRaw } from '@/types/contrato.raw'

export function getContratos(): Contrato[] {
  return (ContratosMock as ContratoRaw[]).map(mapContrato)
}

export function mapContrato(raw: ContratoRaw): Contrato {
  return {
    id: String(raw.id),

    clienteId: String(raw.cliente),

    status: normalizeStatusContrato(raw.status),

    valorMensal: raw.valorMensal ?? 0,

    faturamento: {
      status: normalizeStatusFaturamento(raw.faturamentoMes?.status),
      valor: raw.faturamentoMes?.valor ?? 0,
      vencimento: raw.faturamentoMes?.vencimento,
    },

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