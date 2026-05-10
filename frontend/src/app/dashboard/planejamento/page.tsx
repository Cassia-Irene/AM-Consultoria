'use client'

import { useEffect, useState } from 'react'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type PlanningOverview 
} from '@/services/analytics.service'
import { DashboardTabs } from '@/components/DashboardTabs'

function SectionHeader({ label, sub, count }: { label: string; sub?: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between px-1 mb-3">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7D8597]">{label}</p>
        {count !== undefined && <span className="text-[11px] text-sky-500 font-black tabular-nums">({count})</span>}
      </div>
      {sub && <p className="text-[10px] text-[#7D8597] font-bold">{sub}</p>}
    </div>
  )
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: 'red' | 'amber' | 'blue' }) {
  const color = {
    red:   'text-red-500',
    amber: 'text-amber-400',
    blue:  'text-sky-400',
  }[accent ?? 'blue']

  return (
    <div className="bg-[#0d1117] border border-gray-800/20 rounded-2xl p-4 shadow-xl">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#7D8597] mb-1">{label}</p>
      <p className={`text-2xl font-black tabular-nums leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[9px] text-[#7D8597] mt-2 font-medium">{sub}</p>}
    </div>
  )
}

function InstitutionalPlanningCard({ item }: { item: PlanningOverview }) {
  return (
    <div className="bg-[#0d1117] border border-gray-800/40 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-black text-lg tracking-tight">{item.cliente}</h3>
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mt-0.5">Workload Semanal</p>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
          <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest">{item.visitasSemanais} visitas</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-red-950/10 border border-red-900/20 rounded-xl">
          <p className="text-red-500 text-lg font-black">{item.pendenciasAtrasadas}</p>
          <p className="text-[8px] uppercase font-black text-red-500/60 tracking-tighter">Atrasadas</p>
        </div>
        <div className="text-center p-2 bg-amber-950/10 border border-amber-900/20 rounded-xl">
          <p className="text-amber-400 text-lg font-black">{item.pendenciasAtencao}</p>
          <p className="text-[8px] uppercase font-black text-amber-400/60 tracking-tighter">Atenção</p>
        </div>
        <div className="text-center p-2 bg-gray-900/40 border border-gray-800/40 rounded-xl">
          <p className="text-gray-400 text-lg font-black">{item.pendenciasNormais}</p>
          <p className="text-[8px] uppercase font-black text-gray-500 tracking-tighter">Fluxo</p>
        </div>
      </div>
    </div>
  )
}

export default function PlanningPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [planning, setPlanning] = useState<PlanningOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, p] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getPlanning()
        ])
        setSummary(s)
        setPlanning(p)
      } catch (err) {
        console.error('Erro no planejamento:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-sky-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Organizando Estratégia...</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <div className="px-5 pt-6 space-y-8">
        <section>
          <SectionHeader label="Resumo da Capacidade" />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Total Atrasos" value={summary.pendenciasAbertas} accent="red" sub="Pendências críticas" />
            <MetricCard label="Projetos" value={summary.entregasAtraso} accent="amber" sub="Marcos em atraso" />
          </div>
        </section>

        <section>
          <SectionHeader label="Foco por Instituição" count={planning.length} />
          <div className="space-y-4">
            {planning.map((item, i) => (
              <InstitutionalPlanningCard key={i} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
