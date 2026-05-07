import type { Visita } from '@/domain/visita'
import type { Pendencia } from '@/domain/pendencia'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import { getPendenciaSeveridade } from './pendencia'
import { getStatusFaturamento } from '@/domain/faturamento'

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */

export type TipoOperacionalVisita = 
  | 'rotina'
  | 'emergencial'
  | 'projeto'
  | 'suporte_rapido'
  | 'imersao'
  | 'goodwill'
  | 'extra'
  | 'administrativo'
  | 'burocratica'

export type PerfilClienteOperacional = 
  | 'equilibrado'
  | 'drenante'
  | 'urgente'
  | 'alto_goodwill'
  | 'risco_operacional'
  | 'inadimplente'
  | 'dependente'

export interface ClientOperationalHealth {
  clientId: string
  indiceUrgencia: number          // 0-100
  indiceDesgaste: number          // 0-100
  taxaGoodwill: number            // % de visitas extras/nao cobradas
  cargaOperacional: number        // volume absoluto de acoes
  perfil: PerfilClienteOperacional
  horasInvisiveisEstimadas: number // minutos
}

/* ─────────────────────────────────────────────
   CLASSIFICAÇÃO AUTOMÁTICA (INFERÊNCIA)
   ───────────────────────────────────────────── */

/**
 * Infere o tipo operacional de uma visita baseado em padrões e palavras-chave.
 */
export function getTipoOperacionalVisita(
  visita: Visita, 
  contrato?: Contrato,
  pendenciasRelacionadas: Pendencia[] = []
): TipoOperacionalVisita {
  const desc = (visita.descricao || '').toLowerCase()
  const data = new Date(visita.data_hora)
  const hora = data.getHours()
  const diaSemana = data.getDay() // 0 = domingo, 6 = sabado
  const isForaHorario = hora < 8 || hora >= 18 || diaSemana === 0 || diaSemana === 6
  
  const temPendenciaUrgente = pendenciasRelacionadas.some(p => getPendenciaSeveridade(p) === 'urgente')
  const isCurta = (visita.duracao_minutos ?? 0) <= 45
  const isLonga = (visita.duracao_minutos ?? 0) >= 240 // 4h+
  
  // Palavras-chave
  const kUrgente = ['emergência', 'urgente', 'socorro', 'crítico', 'parou', 'problema', 'imediato']
  const kAdmin = ['relatório', 'reunião', 'alinhamento', 'secretaria', 'documento', 'anvisa', 'vigilância']
  const kGoodwill = ['apoio', 'ajuda', 'cortesia', 'favor', 'extra']

  const hasKeyword = (keys: string[]) => keys.some(k => desc.includes(k))

  // 1. Emergencial: Fora de hora, pendencia critica ou keyword
  if (isForaHorario || temPendenciaUrgente || hasKeyword(kUrgente)) return 'emergencial'
  
  // 2. Administrativa/Burocrática
  if (hasKeyword(kAdmin)) return 'administrativo'

  // 3. Projeto: Vinculo explicito
  if (visita.projetoId) return 'projeto'
  
  // 4. Imersão: Longa duracao
  if (isLonga) return 'imersao'
  
  // 5. Goodwill: Keyword ou extra nao cobrado (inferido)
  if (hasKeyword(kGoodwill)) return 'goodwill'

  // 6. Suporte Rápido: Curta sem projeto
  if (isCurta && !visita.projetoId) return 'suporte_rapido'
  
  return visita.tipo_visita === 'rotina' ? 'rotina' : 'extra'
}

/* ─────────────────────────────────────────────
   ESTIMATIVA DE HORAS INVISÍVEIS
   ───────────────────────────────────────────── */

/**
 * Heurística para calcular horas que o Adriano gasta mas não fatura.
 */
export function estimateInvisibleHours(visitas: Visita[]): number {
  return visitas.reduce((acc, v) => {
    const tipo = getTipoOperacionalVisita(v)
    
    // Suporte rápido e Emergenciais curtas tendem a ser "overheads"
    if (tipo === 'suporte_rapido') return acc + 15
    if (tipo === 'emergencial') return acc + 30
    
    // Visitas em finais de semana têm um custo de oportunidade alto
    const data = new Date(v.data_hora)
    if (data.getDay() === 0 || data.getDay() === 6) return acc + 60

    return acc
  }, 0)
}

/* ─────────────────────────────────────────────
   KPIs DE SAÚDE OPERACIONAL
   ───────────────────────────────────────────── */

export function calculateClientHealth(
  clientId: string,
  visitas: Visita[],
  pendencias: Pendencia[],
  contrato?: Contrato,
  faturamentos: FaturamentoCliente[] = []
): ClientOperationalHealth {
  const visitasDoCliente = visitas.filter(v => v.contratoId === contrato?.id)
  const pendenciasAbertas = pendencias.filter(p => p.contratoId === contrato?.id && !p.resolvida)
  
  // 1. Indice de Urgência
  const emergenciais = visitasDoCliente.filter(v => getTipoOperacionalVisita(v, contrato) === 'emergencial').length
  const pendenciasUrgentes = pendenciasAbertas.filter(p => getPendenciaSeveridade(p) === 'urgente').length
  const indiceUrgencia = Math.min(100, (emergenciais * 20) + (pendenciasUrgentes * 15))
  
  // 2. Taxa de Goodwill (Visitas extras nao cobradas / total)
  const limiteMensal = contrato?.visitas_previstas_mes ?? 4
  const visitasExtras = Math.max(0, visitasDoCliente.length - limiteMensal)
  const taxaGoodwill = visitasDoCliente.length > 0 ? (visitasExtras / visitasDoCliente.length) * 100 : 0
  
  // 3. Horas Invisiveis Estimadas
  const horasInvisiveis = estimateInvisibleHours(visitasDoCliente)
  
  // 4. Indice de Desgaste
  const hasInadimplencia = faturamentos.some(f => getStatusFaturamento(f) === 'atrasado')
  const indiceDesgaste = Math.min(100, (indiceUrgencia * 0.5) + (taxaGoodwill * 0.3) + (hasInadimplencia ? 20 : 0))
  
  // 5. Perfil (Suggestive labels)
  let perfil: PerfilClienteOperacional = 'equilibrado'
  if (indiceDesgaste > 70) perfil = 'drenante'
  else if (indiceUrgencia > 60) perfil = 'urgente'
  else if (taxaGoodwill > 40) perfil = 'alto_goodwill'
  else if (hasInadimplencia) perfil = 'inadimplente'
  
  return {
    clientId,
    indiceUrgencia,
    indiceDesgaste,
    taxaGoodwill,
    cargaOperacional: visitasDoCliente.length + pendenciasAbertas.length,
    perfil,
    horasInvisiveisEstimadas: horasInvisiveis
  }
}
