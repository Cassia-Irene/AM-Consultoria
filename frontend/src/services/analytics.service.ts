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
  idProjeto?: number
}

export interface OpenPendency {
  id: string | number
  cliente: string
  descricao: string
  responsavel: string
  dataOrigem: string
  dataPrazo?: string
  statusPrazo: 'atrasado' | 'hoje' | 'breve' | 'planejado'
}

export interface CaosScore {
  cliente: string
  idContrato: number
  visitasUrgentes: number
  pendenciasAtrasadas: number
  eventosAtivos: number
  totalAlertas: number
}

export interface FinancialMonth {

  mes: string
  receitaRecorrente: number
  receitaProjetos: number
  receitaTotal: number
}

export interface ClientHealth {
  cliente: string
  idContrato: number
  visitasUrgentes: number
  pendenciasAtrasadas: number
  eventosAtivos: number
  entregasAtrasadas: number
  progressoMedio: number
  totalMinutosInvisiveis: number
  statusOperacional: 'emergência' | 'atenção' | 'normal'
}

export interface OperationalInsight {
  totalHorasInvisiveis: number
  urgenciasNoMes: number
  topDrainingClients: ClientHealth[]
  clientes: { id: string; nome_instituicao: string }[]
  timeline: TimelineEvent[]
}

export interface TodayVisit {
  idVisita: number
  idContrato: number
  dataHora: string
  tipoVisita: string
  modalidade: string
  status: string
  cliente: string
  pendenciasContagem: number
  statusPagamento?: string
  ultimaVisitaResultados?: string
  pendenciasLista?: { id: number; descricao: string; dataPrazo?: string }[]
}

export interface ActiveProject {
  id: number
  cliente: string
  projeto: string
  status: string
  valorTotal: number
  idContrato: number
  entregasPendentes: number
  parcelasPendentes: number
}



export const AnalyticsService = {
  async getSummary(): Promise<DashboardSummary> {
    return fetchApi<DashboardSummary>('/analytics/summary', {}, mockDashboardSummary)
  },

  async getTimeline(): Promise<TimelineEvent[]> {
    return fetchApi<TimelineEvent[]>('/analytics/timeline', {}, mockTimeline)
  },

  async getTodayAgenda(): Promise<TodayVisit[]> {
    return fetchApi<TodayVisit[]>('/analytics/today-agenda', {}, [])
  },

  async getWeeklyAgenda(): Promise<TodayVisit[]> {
    return fetchApi<TodayVisit[]>('/analytics/weekly-agenda', {}, [])
  },




  async getProjects(): Promise<ActiveProject[]> {
    return fetchApi<ActiveProject[]>('/analytics/projects', {}, [])
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
  },

  async getCaosScore(): Promise<CaosScore[]> {
    try {
      return await fetchApi<CaosScore[]>('/analytics/caos-score', {}, [])
    } catch (err) {
      console.warn('[FRONTEND] Endpoint /analytics/caos-score não encontrado. Usando lista vazia.', err)
      return []
    }
  },

  async getClientHealth(): Promise<ClientHealth[]> {
    return fetchApi<ClientHealth[]>('/analytics/client-health', {}, [])
  },

  /**
   * Agregador para o Modo Reflexão.
   * Constrói o snapshot a partir de múltiplos endpoints existentes.
   * A inteligência agora é 100% SQL (via /client-health).
   */
  async getOperationalSnapshot(): Promise<OperationalInsight> {
    const [timeline, healthData] = await Promise.all([
      this.getTimeline(),
      this.getClientHealth()
    ])

    // Filtro de urgências do mês (ainda necessário para o KPI de topo, mas a inteligência de horas foi pro SQL)
    const urgenciasNoMes = healthData.reduce((acc, curr) => acc + curr.visitasUrgentes, 0)
    const totalMinutosInvisiveis = healthData.reduce((acc, curr) => acc + curr.totalMinutosInvisiveis, 0)

    return {
      totalHorasInvisiveis: totalMinutosInvisiveis,
      urgenciasNoMes,
      topDrainingClients: healthData.sort((a, b) => b.eventosAtivos - a.eventosAtivos || b.visitasUrgentes - a.visitasUrgentes),
      clientes: healthData.map(c => ({ id: String(c.idContrato), nome_instituicao: c.cliente })),
      timeline
    }
  },

  /**
   * Helper para filtrar e formatar a timeline no formato esperado pelo componente OperationalTimeline.
   */
  getOperationalTimeline(data: OperationalInsight): { id: string; idReferencia: number; date: string; type: string; title: string; subtitle: string; critical: boolean; pendencias?: { id: string; descricao: string; data_prazo: string }[] }[] {
    return (data.timeline || []).map(event => ({
      id: `${event.tipo}-${event.idReferencia}`,
      idReferencia: event.idReferencia,
      date: event.data,
      type: event.tipo,
      title: event.titulo,
      subtitle: event.cliente,
      critical: event.criticidade === 'critica' || event.criticidade === 'alta',
      idProjeto: event.idProjeto,
      pendencias: event.pendenciasLista?.map(p => ({
        id: String(p.id),
        descricao: p.descricao,
        data_prazo: p.dataPrazo || ''
      }))
    }))
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

export interface AttentionItem {
  idContrato: number
  cliente: string
  progressoReal: number
  eventosAtivos: number
  state: 'emergência' | 'atenção' | 'normal'
  stagnationRisk: boolean
  lastDeliveryDays: number
  summary: string
  valueNarrative: string
  statusOperacional: string
}
