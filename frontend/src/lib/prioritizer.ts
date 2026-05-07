// src/lib/prioritizer.ts
//
// Algoritmo de priorização do Modo Caos.
// Determina o único item mais urgente do sistema agora.

import type { Pendencia } from '@/domain/pendencia'
import type { InsightPrioridade } from '@/domain/insight'
import { getDiffDias } from '@/utils/date'

/* ─── helpers internos ─── */

function labelPrazo(prazo: string): string {
  const diff = getDiffDias(prazo)
  if (diff < 0) return diff === -1 ? 'ontem' : `${Math.abs(diff)}d atrás`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return `em ${diff}d`
}

/**
 * Calcula score de urgência para uma pendência.
 *
 * Regras (maior score = maior prioridade):
 *   1. Atrasado (diff < 0):  base 1000 + quanto mais atrasado, maior
 *   2. Vence hoje  (diff 0): 500
 *   3. Vence amanhã (diff 1): 400
 *   4. Vence em 2d  (diff 2): 300
 *   5. Sem prazo:            0 (nunca vira top1 se houver algo com prazo)
 */
function scorePendencia(p: Pendencia): number {
  if (!p.data_prazo) return 0

  const diff = getDiffDias(p.data_prazo)

  if (diff < 0)  return 1000 + Math.abs(diff) * 10   // atrasado: escala com atraso
  if (diff === 0) return 500
  if (diff === 1) return 400
  if (diff === 2) return 300

  return 0
}

/**
 * Retorna o único item mais importante do sistema agora.
 * Recebe apenas pendências abertas.
 */
export function getTopPrioridade(
  abertas: Pendencia[],
  resolveClienteNome: (p: Pendencia) => string
): InsightPrioridade | null {
  if (abertas.length === 0) return null

  const comScore = abertas
    .map(p => ({ p, score: scorePendencia(p) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  if (comScore.length === 0) return null

  const { p } = comScore[0]
  const diff = getDiffDias(p.data_prazo!)

  return {
    tipo: 'top1',
    titulo: p.descricao,
    descricao: '',
    clienteNome: resolveClienteNome(p),
    entidadeId: p.id,
    href: `/pendencias/${p.id}`,
    prazoLabel: labelPrazo(p.data_prazo!),
    atraso: diff < 0,
  }
}

/**
 * Gera uma recomendação de "Próxima Ação" baseada no contexto do dia.
 */
export function getRecommendedAction(
  visitasHoje: any[],
  pendenciasUrgentes: Pendencia[],
  resolveClienteByContrato: (contratoId: string) => string
): { title: string; action: string; href: string } | null {
  // 1. Se tem visita hoje não realizada, prioridade é registrar/iniciar
  const proximasVisitas = visitasHoje.filter(v => v.status === 'agendada')
  if (proximasVisitas.length > 0) {
    const v = proximasVisitas[0]
    return {
      title: `Registrar visita: ${resolveClienteByContrato(v.contratoId)}`,
      action: 'Iniciar agora',
      href: `/visitas/nova?contratoId=${v.contratoId}`
    }
  }

  // 2. Se tem pendência muito atrasada (> 2 dias)
  const criticas = pendenciasUrgentes.filter(p => getDiffDias(p.data_prazo!) < -2)
  if (criticas.length > 0) {
    const p = criticas[0]
    return {
      title: `Resolver atraso: ${p.descricao}`,
      action: 'Enviar agora',
      href: `/pendencias/${p.id}`
    }
  }

  return null
}
