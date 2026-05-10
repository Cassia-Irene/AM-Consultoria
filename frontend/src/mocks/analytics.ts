import { DashboardSummary, TimelineEvent, TopPriority, OpenPendency, FinancialMonth, PlanningOverview } from '@/services/analytics.service'

export const mockDashboardSummary: DashboardSummary = {
  contratosAtivos: 12,
  pendenciasAbertas: 45,
  eventosCriticos: 3,
  faturamentoMes: 45000.00,
  inadimplenciaCount: 2,
  entregasAtraso: 1
}

export const mockTimeline: TimelineEvent[] = [
  {
    tipo: 'alerta',
    idReferencia: 1,
    idContrato: 1,
    data: new Date().toISOString(),
    titulo: 'Falha Crítica na Escala',
    cliente: 'APAE Bacabal',
    categoria: 'Crítico',
    criticidade: 'critica'
  },
  {
    tipo: 'visita',
    idReferencia: 101,
    idContrato: 2,
    data: new Date().toISOString(),
    titulo: 'Visita de Rotina',
    cliente: 'CAPS II Renascer',
    categoria: 'administrativa',
    criticidade: 'normal',
    statusPagamento: 'pago',
    pendenciasContagem: 2,
    ultimaVisitaResultados: 'Realizada conferência de estoque. Faltam 3 itens na farmácia.'
  },
  {
    tipo: 'pendencia',
    idReferencia: 50,
    idContrato: 3,
    data: new Date(Date.now() - 86400000).toISOString(),
    titulo: 'Falta de Documentação Profissional',
    cliente: 'CuidaBem Home Care',
    categoria: 'RH',
    criticidade: 'alta'
  }
]

export const mockTopPriorities: TopPriority[] = [
  {
    id: 50,
    idContrato: 3,
    tipo: 'pendencia',
    titulo: 'Falta de Documentação Profissional',
    cliente: 'CuidaBem Home Care',
    dataPrazo: new Date().toISOString().split('T')[0],
    statusPrazo: 'hoje',
    scorePrioridade: 100
  },
  {
    id: 51,
    idContrato: 1,
    tipo: 'pendencia',
    titulo: 'Revisão de Prontuários',
    cliente: 'APAE Bacabal',
    dataPrazo: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    statusPrazo: 'atrasado',
    scorePrioridade: 90
  },
  {
    id: 52,
    idContrato: 2,
    tipo: 'pendencia',
    titulo: 'Relatório ANVISA semestral',
    cliente: 'CAPS II Renascer',
    dataPrazo: new Date(Date.now() + 1209600000).toISOString().split('T')[0], // 14 dias
    statusPrazo: 'em 14d',
    scorePrioridade: 50
  },
  {
    id: 53,
    idContrato: 3,
    tipo: 'pendencia',
    titulo: 'Plano de ação — vigilância',
    cliente: 'CuidaBem Home Care',
    dataPrazo: new Date(Date.now() + 1728000000).toISOString().split('T')[0], // 20 dias
    statusPrazo: 'em 20d',
    scorePrioridade: 40
  }
]

export const mockPlanningOverview: PlanningOverview[] = [
  {
    cliente: 'APAE Bacabal',
    visitasSemanais: 2,
    pendenciasAtrasadas: 3,
    pendenciasAtencao: 1,
    pendenciasNormais: 5
  },
  {
    cliente: 'CAPS II Renascer',
    visitasSemanais: 1,
    pendenciasAtrasadas: 0,
    pendenciasAtencao: 2,
    pendenciasNormais: 4
  }
]

export const mockOpenPendencies: OpenPendency[] = []
export const mockFinanceData: FinancialMonth[] = []
