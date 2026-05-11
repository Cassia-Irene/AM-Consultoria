'use client'

import { useEffect, useState } from 'react'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type OpenPendency,
  type TodayVisit
} from '@/services/analytics.service'
import { DashboardTabs } from '@/components/DashboardTabs'
import { VisitaRotinaCard } from '@/components/VisitaRotinaCard'


// --- Componentes de UI ---

function SectionHeader({ label, sub, count }: { label: string; sub?: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between px-1 mb-4">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7D8597]">{label}</p>
        {count !== undefined && <span className="text-[11px] text-[#4A5568] font-bold">({count})</span>}
      </div>
      {sub && <p className="text-[10px] text-[#7D8597] font-bold">{sub}</p>}
    </div>
  )
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: 'red' | 'amber' | 'yellow' | 'blue' }) {
  const color = {
    red:    'text-red-500',
    amber:  'text-amber-400',
    yellow: 'text-[#FFD700]',
    blue:   'text-sky-400',
  }[accent ?? 'blue']

  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl p-4 lg:p-6 shadow-xl transition-all hover:border-[#0466C8]/30">
      <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#7D8597] mb-1.5">{label}</p>
      <p className={`text-2xl lg:text-3xl font-black tabular-nums leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[9px] lg:text-[10px] text-[#4A5568] mt-2 font-bold">{sub}</p>}
    </div>
  )
}

function PendenciaItem({ item, cor }: { item: OpenPendency; cor: 'red' | 'amber' | 'zinc' }) {
  const border = {
    red: 'border-red-500',
    amber: 'border-amber-400',
    zinc: 'border-zinc-700'
  }[cor]

  const text = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    zinc: 'text-zinc-500'
  }[cor]

  return (
    <div className={`flex items-center gap-4 bg-[#0d1117] border-l-4 ${border} rounded-r-xl px-4 py-3.5 hover:bg-[#161b22] transition-colors`}>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate">{item.descricao}</p>
        <p className="text-[#4A5568] text-[10px] mt-1 font-bold truncate">{item.cliente} · {item.responsavel}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`${text} text-[10px] font-black uppercase tracking-tighter tabular-nums`}>
          {item.dataPrazo ? labelPrazo(item.dataPrazo) : '—'}
        </span>
      </div>
    </div>
  )
}

function labelPrazo(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0,0,0,0)
  d.setHours(0,0,0,0)
  
  const diff = d.getTime() - today.getTime()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return days === -1 ? 'ontem' : `${Math.abs(days)}d atrás`
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days}d`
}

export default function PlanningPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [visitsToday, setVisitsToday] = useState<TodayVisit[]>([])
  const [pendencies, setPendencies] = useState<OpenPendency[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [s, today, p] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getTodayAgenda(),
          AnalyticsService.getPendencies()
        ])
        setSummary(s)
        setVisitsToday(today)
        setPendencies(p)
      } catch (err) {
        console.error('Erro no planejamento:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-sky-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Organizando Estratégia...</span>
      </div>
    )
  }


  const atrasados = pendencies.filter(p => p.statusPrazo === 'atrasado')
  const emBreve = pendencies.filter(p => p.statusPrazo === 'hoje' || p.statusPrazo === 'breve')
  const demais = pendencies.filter(p => p.statusPrazo === 'planejado')


  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <div className="px-4 pt-5 space-y-8">
        
        {/* VISÃO GERAL */}
        <section>
          <SectionHeader label="Visão Geral" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Atrasados" value={atrasados.length} accent="red" />
            <MetricCard label="Atenção" value={emBreve.length} accent="amber" />
            <MetricCard label="A Receber" value={`R$ ${(summary.faturamentoMes).toLocaleString('pt-BR')}`} accent="yellow" />
            <MetricCard label="Clientes Ativos" value={summary.contratosAtivos} accent="blue" />
          </div>
        </section>

        {/* AGENDA DE HOJE */}
        <section>
          <SectionHeader label="Agenda de Hoje" count={visitsToday.length} sub={visitsToday.length + " visitas"} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitsToday.length > 0 ? (
              visitsToday.map((v, i) => <VisitaRotinaCard key={i} event={v} />)
            ) : (
              <div className="py-12 text-center bg-[#0d1117] rounded-3xl border border-dashed border-[#23272F]">
                <p className="text-[#4A5568] text-sm font-bold">Nenhuma visita agendada para hoje.</p>
              </div>
            )}
          </div>
        </section>

        {/* LISTAS DE PENDÊNCIAS */}
        <div className="space-y-8">
          
          {/* ATRASADOS */}
          {atrasados.length > 0 && (
            <section>
              <SectionHeader label="Atrasados" count={atrasados.length} />
              <div className="space-y-2">
                {atrasados.map((p, i) => <PendenciaItem key={i} item={p} cor="red" />)}
              </div>
            </section>
          )}

          {/* VENCEM EM BREVE */}
          {emBreve.length > 0 && (
            <section>
              <SectionHeader label="Vencem em breve" count={emBreve.length} />
              <div className="space-y-2">
                {emBreve.map((p, i) => <PendenciaItem key={i} item={p} cor="amber" />)}
              </div>
            </section>
          )}

          {/* DEMAIS PENDÊNCIAS */}
          {demais.length > 0 && (
            <section>
              <SectionHeader label="Demais Pendências" count={demais.length} />
              <div className="space-y-2">
                {demais.map((p, i) => <PendenciaItem key={i} item={p} cor="zinc" />)}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  )
}
