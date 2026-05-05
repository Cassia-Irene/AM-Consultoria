// src/utils/contratoTimeline.ts
//
// Constrói a linha do tempo de evolução dos contratos baseada em HISTORICO_CONTRATOS.

import type { Contrato, HistoricoContrato } from '@/domain/contrato'

export type TimelineItem =
  | {
      type: 'criacao'
      contratoId: string
      data: string
      label: string
    }
  | {
      type: 'substituicao'
      contratoEncerradoId: string
      contratoNovoId: string
      data: string
      motivo: string
      label: string
    }
  | {
      type: 'ativo'
      contratoId: string
      data: string
      label: string
    }

/**
 * Reconstrói a cadeia de contratos e gera os itens da timeline ordenados.
 */
export function buildContratoTimeline(
  contratos: Contrato[],
  historicos: HistoricoContrato[],
  contratoId: string
): TimelineItem[] {
  const timeline: TimelineItem[] = []
  
  // 1. Encontrar a cadeia completa (passado e futuro)
  const cadeiaIds = new Set<string>()
  cadeiaIds.add(contratoId)

  // Voltar no tempo
  let atualPassado = contratoId
  let anterior: HistoricoContrato | undefined
  do {
    anterior = historicos.find(h => h.idContratoNovo === atualPassado)
    if (anterior) {
      cadeiaIds.add(anterior.idContratoEncerrado)
      atualPassado = anterior.idContratoEncerrado
    }
  } while (anterior)

  // Avançar no tempo
  let atualFuturo = contratoId
  let proximo: HistoricoContrato | undefined
  do {
    proximo = historicos.find(h => h.idContratoEncerrado === atualFuturo)
    if (proximo) {
      cadeiaIds.add(proximo.idContratoNovo)
      atualFuturo = proximo.idContratoNovo
    }
  } while (proximo)

  // 2. Coletar os contratos da cadeia
  const contratosCadeia = contratos.filter(c => cadeiaIds.has(c.id))
  
  // 3. Gerar eventos
  
  // Eventos de Criação
  contratosCadeia.forEach(c => {
    timeline.push({
      type: 'criacao',
      contratoId: c.id,
      data: c.data_inicio,
      label: 'Contrato iniciado'
    })
  })

  // Eventos de Substituição
  historicos.forEach(h => {
    if (cadeiaIds.has(h.idContratoEncerrado) && cadeiaIds.has(h.idContratoNovo)) {
      timeline.push({
        type: 'substituicao',
        contratoEncerradoId: h.idContratoEncerrado,
        contratoNovoId: h.idContratoNovo,
        data: h.dataAlteracao,
        motivo: h.motivo,
        label: 'Contrato substituído'
      })
    }
  })

  // Evento de Ativo (apenas para o contrato atual da cadeia que estiver ativo)
  const contratoAtivo = contratosCadeia.find(c => c.status === 'ativo')
  if (contratoAtivo) {
    timeline.push({
      type: 'ativo',
      contratoId: contratoAtivo.id,
      data: new Date().toISOString().split('T')[0], // Hoje
      label: 'Contrato atual ativo'
    })
  }

  // 4. Ordenar por data ASC
  return timeline.sort((a, b) => {
    if (a.data === b.data) {
      // Se data igual, criacao vem antes de substituicao
      const weights = { criacao: 1, substituicao: 2, ativo: 3 }
      return weights[a.type] - weights[b.type]
    }
    return new Date(a.data).getTime() - new Date(b.data).getTime()
  })
}
