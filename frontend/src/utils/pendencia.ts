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
  
  // 1. Checagem por Score (Inteligência do Backend)
  const score = p.score_prioridade || 0
  if (score >= 1000) return 'urgente'
  if (score >= 300) return 'atencao'
  
  // 2. Inteligência Semântica (Failsafe para criação manual)
  const texto = (p.descricao || '').toLowerCase()
  const palavrasUrgentes = ['urgente', 'urgência', 'urgencia', 'crítico', 'critico', 'emergência', 'emergencia', 'imediato', 'imediata']
  
  if (palavrasUrgentes.some(palavra => texto.includes(palavra))) {
    return 'urgente'
  }
  
  return 'normal'
}
