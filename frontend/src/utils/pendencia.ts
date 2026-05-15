import type { Pendencia } from '@/domain/pendencia'

export type StatusPendenciaDerivado = 'concluida' | 'aberta' | 'atrasada'
export type SeveridadePendencia = 'urgente' | 'atencao' | 'normal'

export function getPendenciaStatus(p: Pendencia): StatusPendenciaDerivado {
  if (p.resolvida) return 'concluida'
  if ((p.dias_atraso || 0) > 0) return 'atrasada'
  return 'aberta'
}

export function getPendenciaSeveridade(p: Pendencia): SeveridadePendencia {
  if (p.resolvida) return 'normal'
  
  const score = p.score_prioridade || 0
  if (score >= 1000) return 'urgente'
  if (score >= 300) return 'atencao'
  
  return 'normal'
}
