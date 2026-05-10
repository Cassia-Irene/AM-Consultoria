'use client'

import { useEffect, useState } from 'react'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type FinancialMonth,
  type ActiveProject
} from '@/services/analytics.service'



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
  const [projects, setProjects] = useState<ActiveProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, f, p] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getFinance(),
          AnalyticsService.getProjects()
        ])
        setSummary(s)
        setFinance(f)
        setProjects(p)
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


      <header className="px-5 pt-8 pb-8">
        <h1 className="text-white text-3xl font-black tracking-tight">Financeiro</h1>
        <p className="text-zinc-500 text-sm mt-1">Visão estratégica e saúde financeira</p>
      </header>

      <div className="px-5 space-y-12">
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

        {/* Seção de Projetos Ativos */}
        {projects.length > 0 && (
          <section>
            <SectionHeader label="Projetos em Andamento" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-sky-900/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{proj.cliente}</p>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-[9px] font-black uppercase tracking-tighter">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-4 leading-tight">{proj.projeto}</h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] font-medium uppercase">Valor Total</span>
                    <span className="text-white font-black text-sm tabular-nums">{formatCurrency(Number(proj.valorTotal))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
