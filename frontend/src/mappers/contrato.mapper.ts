import type { Contrato, HistoricoContrato } from '@/domain/contrato'
import type { ContratoRaw, HistoricoContratoRaw } from '@/types/contrato.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'
import { IntegrationError } from '@/utils/errors'

// Removidas funções de mock para enforçar realidade operacional.

export function mapContrato(raw: ContratoRaw): Contrato {
  // Validação Estrita conforme ContratoRead
  if (!raw.id_contrato) {
    warnInvalidShape('Contrato:ID_MISSING', raw)
    throw new IntegrationError('Contrato', 'id_contrato ausente no contrato real', raw)
  }
  if (!raw.id_cliente) {
    warnInvalidShape('Contrato:CLIENTE_ID_MISSING', raw)
    throw new IntegrationError('Contrato', 'id_cliente ausente no contrato real', raw)
  }

  validateShape<ContratoRaw>('ContratoRead', raw, [
    'id_contrato',
    'id_cliente',
    'servicos_contratados',
    'visitas_previstas_mes',
    'data_inicio'
  ])

  // Derivação de Status (Regra de Negócio Front)
  const hoje = new Date().toISOString().split('T')[0]
  const statusDerivado: 'ativo' | 'inativo' = (raw.data_fim && raw.data_fim < hoje) ? 'inativo' : 'ativo'

  return {
    id: String(raw.id_contrato),
    clienteId: String(raw.id_cliente),

    servicos_contratados: raw.servicos_contratados || 'Serviços não informados',
    visitas_previstas_mes: raw.visitas_previstas_mes ?? 0,
    inclui_relatorio: !!raw.inclui_relatorio,

    data_inicio: raw.data_inicio,
    data_fim: raw.data_fim ?? undefined,
    
    // Campo híbrido (não existe no backend contratos)
    valor_mensal: 0, 
    
    status: statusDerivado,
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