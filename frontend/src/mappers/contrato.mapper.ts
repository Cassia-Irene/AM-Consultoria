import { Contratos as Mock } from '@/lib/mocks'
import type { Contrato, HistoricoContrato } from '@/domain/contrato'
import type { ContratoRaw, HistoricoContratoRaw } from '@/types/contrato.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getContratos(): Contrato[] {
  return (Mock as unknown as ContratoRaw[]).map(mapContrato)
}

export function mapContrato(raw: ContratoRaw): Contrato {
  const idResolved = raw.id_contrato ?? raw.id
  const clienteIdResolved = raw.id_cliente ?? raw.clienteId

  if (!idResolved) {
    warnInvalidShape('Contrato:ID_MISSING', raw)
    throw new Error('[MAPPER][CONTRATO] Campo obrigatório ausente: id_contrato/id')
  }
  if (!clienteIdResolved) {
    warnInvalidShape('Contrato:CLIENTE_ID_MISSING', raw)
    throw new Error('[MAPPER][CONTRATO] Campo obrigatório ausente: id_cliente/clienteId')
  }

  validateShape<ContratoRaw>('ContratoRaw', raw, [
    'data_inicio',
    'servicos_contratados',
    'visitas_previstas_mes'
  ])

  return {
    id: String(idResolved),
    clienteId: String(clienteIdResolved),

    data_inicio: raw.data_inicio,
    data_fim: raw.data_fim ?? undefined,
    servicos_contratados: raw.servicos_contratados,
    visitas_previstas_mes: Number(raw.visitas_previstas_mes || 0),
    inclui_relatorio: !!raw.inclui_relatorio,
    
    valor_mensal: Number(raw.valor_mensal || 0),
    observacoes_gerais: raw.observacoes_gerais || '',
    status: (raw.data_fim && new Date(raw.data_fim) < new Date()) ? 'inativo' : 'ativo',

    // Inteligência (Back-First)
    indice_urgencia: raw.indice_urgencia,
    indice_desgaste: raw.indice_desgaste,
    perfil: raw.perfil,
    motivo_saude: raw.motivo_saude,
    intensidade_operacional: raw.intensidade_operacional,
    desgaste_acumulado: raw.desgaste_acumulado,
    personalidade: raw.personalidade,
    tendencia_relacionamento: raw.tendencia_relacionamento,
    evidencias: raw.evidencias,
    motivo_auditavel: raw.motivo_auditavel,
    desgaste_longitudinal: raw.desgaste_longitudinal,
    dependencia_operacional: raw.dependencia_operacional,
    capacidade_recuperacao: raw.capacidade_recuperacao,
    perfil_pragmatico: raw.perfil_pragmatico,
    override_ativo: !!raw.override_ativo,
  }
}

export function mapHistorico(raw: HistoricoContratoRaw): HistoricoContrato {
  return {
    id: String(raw.id_historico),
    contratoId: String(raw.id_contrato_encerrado),
    data_alteracao: raw.data_alteracao,
    evento: raw.motivo_alteracao,
    // Note: Campos de valor não estão no Raw actual, mas deixamos o shape pronto
  }
}