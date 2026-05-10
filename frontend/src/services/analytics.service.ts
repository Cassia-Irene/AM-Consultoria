import { fetchApi } from './api'
import { 
  mockDashboardSummary, 
  mockTimeline, 
  mockTopPriorities, 
  mockOpenPendencies, 
  mockFinanceData,
  mockPlanningOverview
} from '@/mocks/analytics'

export interface DashboardSummary {
  contratosAtivos: number
  pendenciasAbertas: number
  eventosCriticos: number
  faturamentoMes: number
  inadimplenciaCount: number
  entregasAtraso: number
}

export interface TimelineEvent {
  tipo: 'visita' | 'pendencia' | 'financeiro' | 'alerta' | 'projeto'
  idReferencia: number
  idContrato: number
  data: string
  titulo: string
  cliente: string
  categoria: string
  criticidade: 'normal' | 'alta' | 'critica'
  statusPagamento?: 'pago' | 'pendente' | 'atrasado'
  pendenciasContagem?: number
  ultimaVisitaResultados?: string
  pendenciasLista?: { id: number; descricao: string; dataPrazo?: string }[]
}

export interface OpenPendency {
  cliente: string
  descricao: string
  responsavel: string
  dataOrigem: string
  dataPrazo?: string
  statusPrazo: 'atrasado' | 'no prazo'
}

export interface FinancialMonth {
  mes: string
  receitaRecorrente: number
  receitaProjetos: number
  receitaTotal: number
}

export const AnalyticsService = {
  async getSummary(): Promise<DashboardSummary> {
    return fetchApi<DashboardSummary>('/analytics/summary', {}, mockDashboardSummary)
  },

  async getTimeline(): Promise<TimelineEvent[]> {
    return fetchApi<TimelineEvent[]>('/analytics/timeline', {}, mockTimeline)
  },

  async getPendencies(): Promise<OpenPendency[]> {
    return fetchApi<OpenPendency[]>('/analytics/pendencies', {}, mockOpenPendencies)
  },

  async getFinance(): Promise<FinancialMonth[]> {
    return fetchApi<FinancialMonth[]>('/analytics/finance', {}, mockFinanceData)
  },

  async getPriorities(): Promise<TopPriority[]> {
    return fetchApi<TopPriority[]>('/analytics/priorities', {}, mockTopPriorities)
  },

  async getPlanning(): Promise<PlanningOverview[]> {
    return fetchApi<PlanningOverview[]>('/analytics/planning', {}, mockPlanningOverview)
  }
}

export interface PlanningOverview {
  cliente: string
  visitasSemanais: number
  pendenciasAtrasadas: number
  pendenciasAtencao: number
  pendenciasNormais: number
}

export interface TopPriority {
  id: number
  idContrato: number
  tipo: string
  titulo: string
  cliente: string
  dataPrazo?: string
  statusPrazo: string
  scorePrioridade: number
}
