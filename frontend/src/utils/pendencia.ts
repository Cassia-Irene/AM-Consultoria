import type { Pendencia } from '@/domain/pendencia'
import { getDiffDias } from './date'

export type StatusPendenciaDerivado = 'concluida' | 'aberta' | 'atrasada'
export type SeveridadePendencia = 'urgente' | 'atencao' | 'normal'

export function getPendenciaStatus(p: Pendencia): StatusPendenciaDerivado {
  if (p.resolvida) return 'concluida'
  if (p.data_prazo && getDiffDias(p.data_prazo) < 0) return 'atrasada'
  return 'aberta'
}

export function getPendenciaSeveridade(p: Pendencia): SeveridadePendencia {
  if (p.resolvida) return 'normal' // Ou o que fizer sentido pra concluída
  return getSeveridadeFromPrazo(p.data_prazo)
}

export function getSeveridadeFromPrazo(prazo?: string): SeveridadePendencia {
  if (!prazo) return 'normal'
  
  const diff = getDiffDias(prazo)
  
  if (diff < 0) return 'urgente' // Atrasada -> urgente
  if (diff <= 1) return 'atencao' // Vence hoje ou amanhã -> atenção
  
  return 'normal'
}
