import { Contratos as ContratosMock } from '@/mocks/contratos'
import { HistoricosContratos as HistoricosMock } from '@/mocks/historicos'
import type { Contrato, HistoricoContrato } from '@/domain/contrato'
import type { ContratoRaw, HistoricoContratoRaw } from '@/types/contrato.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getContratos(): Contrato[] {
  return (ContratosMock as unknown as ContratoRaw[]).map(mapContrato)
}

export function getHistoricos(): HistoricoContrato[] {
  return (HistoricosMock as unknown as HistoricoContratoRaw[]).map(mapHistorico)
}

export function getClienteFromContratoId(contratoId: string): string | undefined {
  const contratos = getContratos()
  return contratos.find(c => c.id === contratoId)?.clienteId
}

export function mapContrato(raw: ContratoRaw): Contrato {
  validateShape<ContratoRaw>('ContratoRaw', raw, [
    'id_contrato',
    'id_cliente',
    'servicos_contratados',
    'visitas_previstas_mes',
    'inclui_relatorio',
    'data_inicio',
    'valor_mensal',
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
    valor_mensal: parseFloat(raw.valor_mensal),
    status: raw.status as 'ativo' | 'inativo' | 'suspenso',

    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}

export function mapHistorico(raw: HistoricoContratoRaw): HistoricoContrato {
  validateShape<HistoricoContratoRaw>('HistoricoContratoRaw', raw, [
    'id_historico',
    'id_contrato_encerrado',
    'id_contrato_novo',
    'data_alteracao',
    'motivo_alteracao'
  ])

  return {
    id: String(raw.id_historico),
    idContratoEncerrado: String(raw.id_contrato_encerrado),
    idContratoNovo: String(raw.id_contrato_novo),
    dataAlteracao: raw.data_alteracao,
    motivo: raw.motivo_alteracao
  }
}