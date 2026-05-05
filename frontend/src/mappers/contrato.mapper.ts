// src/mappers/contrato.mapper.ts
//
// Converte ContratoRaw (shape da API) → Contrato (domain).
// Validação estrita conforme novo mapa lógico.

import { Contratos as ContratosMock } from '@/mocks/contratos'
import type { Contrato } from '@/domain/contrato'
import type { ContratoRaw } from '@/types/contrato.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getContratos(): Contrato[] {
  return (ContratosMock as unknown as ContratoRaw[]).map(mapContrato)
}

export function mapContrato(raw: ContratoRaw): Contrato {
  validateShape<ContratoRaw>('ContratoRaw', raw, [
    'id_contrato',
    'id_cliente',
    'servicos_contratados',
    'visitas_previstas_mes',
    'inclui_relatorio',
    'data_inicio',
    'status'
  ])

  if (!raw.id_contrato) throw new Error(`ContratoRaw missing required field: id_contrato`)
  if (!raw.id_cliente) throw new Error(`ContratoRaw missing required field: id_cliente`)
  if (!raw.servicos_contratados) throw new Error(`ContratoRaw (ID: ${raw.id_contrato}) missing required field: servicos_contratados`)
  if (!raw.data_inicio) throw new Error(`ContratoRaw (ID: ${raw.id_contrato}) missing required field: data_inicio`)

  return {
    id: String(raw.id_contrato),
    clienteId: String(raw.id_cliente),

    servicos_contratados: raw.servicos_contratados,
    visitas_previstas_mes: raw.visitas_previstas_mes,
    inclui_relatorio: raw.inclui_relatorio,

    data_inicio: raw.data_inicio,
    data_fim: raw.data_fim ?? undefined,
    status: raw.status as any, // Cast temporário ou normalização

    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}