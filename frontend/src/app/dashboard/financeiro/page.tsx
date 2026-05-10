'use client'

import { useEffect, useState } from 'react'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type FinancialMonth 
} from '@/services/analytics.service'
import { DashboardTabs } from '@/components/DashboardTabs'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{label}</h2>
      <div className="flex-1 h-px bg-zinc-800/50" />
    </div>
  )
}

function FinanceCard({ label, value, description, color, isCurrency = true }: { label: string; value: number; description: string; color: 'sky' | 'amber' | 'emerald'; isCurrency?: boolean }) {
  const colors = {
    sky: 'text-sky-400 border-sky-900/20 bg-sky-950/10',
    amber: 'text-amber-400 border-amber-900/20 bg-amber-950/10',
    emerald: 'text-emerald-400 border-emerald-900/20 bg-emerald-950/10',
  }
  return (
    <div className={`rounded-3xl border p-6 ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-black tabular-nums tracking-tighter mb-2">
        {isCurrency ? formatCurrency(value) : value}
      </p>
      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{description}</p>
    </div>
  )
}

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [finance, setFinance] = useState<FinancialMonth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, f] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getFinance()
        ])
        setSummary(s)
        setFinance(f)
      } catch (err) {
        console.error('Erro no financeiro:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-emerald-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Consolidando Receitas...</span>
      </div>
    )
  }


  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <header className="px-5 pt-8 pb-8">
        <h1 className="text-white text-3xl font-black tracking-tight">Financeiro</h1>
        <p className="text-zinc-500 text-sm mt-1">Visão estratégica e saúde financeira</p>
      </header>

      <div className="px-5 space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinanceCard 
            label="Receita Mensal (MRR)" 
            value={Number(summary.faturamentoMes)} 
            description="Total recorrente de contratos ativos"
            color="sky"
          />
          <FinanceCard 
            label="Inadimplência" 
            value={summary.inadimplenciaCount} 
            description="Clientes com pendências financeiras"
            color="amber"
            isCurrency={false}
          />
          <FinanceCard 
            label="Histórico Total" 
            value={finance.reduce((acc, f) => acc + Number(f.receitaTotal), 0)} 
            description="Receita total acumulada registrada"
            color="emerald"
          />
        </section>

        <section>
          <SectionHeader label="Histórico Mensal" />
          <div className="space-y-3">
            {finance.map((f, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-bold capitalize">{new Date(f.mes).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</p>
                  <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                    Recorrente: {formatCurrency(Number(f.receitaRecorrente))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-black text-sm tabular-nums">
                    {formatCurrency(Number(f.receitaTotal))}
                  </p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Total Recebido</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
