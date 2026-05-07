import { DashboardService, type DashboardResponse } from './dashboard.service'
import { 
  calculateClientHealth, 
  getTipoOperacionalVisita,
  type ClientOperationalHealth,
  type TipoOperacionalVisita
} from '@/utils/operational-kpis'

export interface OperationalInsight extends DashboardResponse {
  healthByClient: Map<string, ClientOperationalHealth>
  topDrainingClients: ClientOperationalHealth[]
  totalHorasInvisiveis: number
  urgenciasNoMes: number
}

export const AnalyticsService = {
  async getOperationalSnapshot(): Promise<OperationalInsight> {
    const data = await DashboardService.getDashboardData()
    const { visitas, pendencias, contratos, faturamentos, clientes } = data
    
    const healthByClient = new Map<string, ClientOperationalHealth>()
    let totalHorasInvisiveis = 0
    let urgenciasNoMes = 0
    
    clientes.forEach(cliente => {
      const contrato = contratos.find(c => c.clienteId === cliente.id)
      const health = calculateClientHealth(
        cliente.id,
        visitas,
        pendencias,
        contrato,
        faturamentos.filter(f => f.contratoId === contrato?.id)
      )
      healthByClient.set(cliente.id, health)
      totalHorasInvisiveis += health.horasInvisiveisEstimadas
    })
    
    // Contagem de urgencias reais (inferidas)
    visitas.forEach(v => {
      if (getTipoOperacionalVisita(v) === 'emergencial') {
        urgenciasNoMes++
      }
    })
    
    const topDrainingClients = Array.from(healthByClient.values())
      .sort((a, b) => b.indiceDesgaste - a.indiceDesgaste)
      .slice(0, 3)
      
    return {
      ...data,
      healthByClient,
      topDrainingClients,
      totalHorasInvisiveis,
      urgenciasNoMes
    }
  },

  /**
   * Traduz a massa de dados em uma timeline de eventos operacionais significativos
   */
  getOperationalTimeline(data: DashboardResponse) {
    const events: { 
      date: string; 
      type: TipoOperacionalVisita | 'pendencia' | 'financeiro'; 
      title: string; 
      subtitle: string;
      critical: boolean;
    }[] = []
    
    data.visitas.forEach(v => {
      const tipo = getTipoOperacionalVisita(v)
      events.push({
        date: v.data_hora,
        type: tipo,
        title: v.descricao,
        subtitle: tipo.toUpperCase(),
        critical: tipo === 'emergencial'
      })
    })
    
    data.pendencias.filter(p => !p.resolvida).forEach(p => {
      events.push({
        date: p.data_prazo || p.data_origem,
        type: 'pendencia',
        title: p.descricao,
        subtitle: 'PENDÊNCIA EM ABERTO',
        critical: true // Pendencias abertas sao criticas na timeline
      })
    })
    
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async getClientInsight(clientId: string): Promise<ClientOperationalHealth | null> {
    const data = await DashboardService.getDashboardData()
    const { visitas, pendencias, contratos, faturamentos } = data
    
    const contrato = contratos.find(c => c.clienteId === clientId)
    if (!contrato) return null

    return calculateClientHealth(
      clientId,
      visitas,
      pendencias,
      contrato,
      faturamentos.filter(f => f.contratoId === contrato.id)
    )
  }
}
