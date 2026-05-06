'use client'
// app/dashboard/financeiro/page.tsx
//
// Dashboard financeiro consolidado.
// Integra contratos (recorrente), projetos (pontual) e faturamento (fluxo).

import { useState, useEffect } from 'react'
import { DashboardService, type DashboardResponse } from '@/services/dashboard.service'
import { formatCurrency, calcularReceitaMensal, calcularReceitaProjetos, calcularReceitaFaturada } from '@/utils/finance'

export default function FinanceiroPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    DashboardService.getDashboardData()
      .then(res => {
        if (isMounted) {
          setData(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Erro ao carregar dados financeiros.')
          setLoading(false)
        }
      })
    return () => { isMounted = false }
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error || !data) return <ErrorState message={error || 'Sem dados'} />

  const receitaMensal = calcularReceitaMensal(data.contratos)
  const receitaProjetos = calcularReceitaProjetos(data.projetos)
  const receitaRecebida = calcularReceitaFaturada(data.faturamentos)

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      <header className="px-5 pt-12 pb-8">
        <h1 className="text-white text-3xl font-black tracking-tight">Financeiro</h1>
        <p className="text-zinc-500 text-sm mt-1">Visão consolidada de receitas e faturamento</p>
      </header>

      <div className="px-5 space-y-10">
        {/* ── METRICAS PRINCIPAIS ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinanceCard 
            label="Receita Recorrente (MRR)" 
            value={receitaMensal} 
            description="Total mensal de contratos ativos"
            color="sky"
          />
          <FinanceCard 
            label="Receita Projetos" 
            value={receitaProjetos} 
            description="Total acumulado em projetos"
            color="amber"
          />
          <FinanceCard 
            label="Receita Recebida" 
            value={receitaRecebida} 
            description="Total faturado e pago"
            color="emerald"
          />
        </section>

        {/* ── LISTAS DETALHADAS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Projetos Recentes */}
          <section>
            <SectionHeader label="Projetos Recentes" />
            <div className="space-y-3">
              {data.projetos.length > 0 ? (
                data.projetos.slice(0, 5).map(p => (
                  <div key={p.id} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate">{p.titulo}</p>
                      <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                        Status: <span className={p.status === 'concluido' ? 'text-emerald-500' : 'text-zinc-400'}>{p.status}</span>
                      </p>
                    </div>
                    <p className="text-zinc-200 font-black text-sm tabular-nums">
                      {formatCurrency(p.valor_total)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-xs italic">Nenhum projeto registrado.</p>
              )}
            </div>
          </section>

          {/* Faturamentos Recentes */}
          <section>
            <SectionHeader label="Faturamentos Recentes" />
            <div className="space-y-3">
              {data.faturamentos.length > 0 ? (
                data.faturamentos.slice(0, 5).map(f => (
                  <div key={f.id} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-bold">Contrato #{f.contratoId}</p>
                      <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                        Período: {f.mes_ano} · <span className={f.pago ? 'text-emerald-500' : 'text-amber-500'}>{f.pago ? 'Pago' : 'Pendente'}</span>
                      </p>
                    </div>
                    <p className="text-zinc-200 font-black text-sm tabular-nums">
                      {formatCurrency(f.valor_total)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-xs italic">Nenhum faturamento registrado.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function FinanceCard({ label, value, description, color }: { label: string; value: number; description: string; color: 'sky' | 'amber' | 'emerald' }) {
  const colors = {
    sky: 'text-sky-400 border-sky-900/20 bg-sky-950/10',
    amber: 'text-amber-400 border-amber-900/20 bg-amber-950/10',
    emerald: 'text-emerald-400 border-emerald-900/20 bg-emerald-950/10',
  }
  return (
    <div className={`rounded-3xl border p-6 ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
      <p className="text-3xl font-black tabular-nums tracking-tighter mb-2">{formatCurrency(value)}</p>
      <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{description}</p>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{label}</h2>
      <div className="flex-1 h-px bg-zinc-800/50" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090D] p-10 space-y-10">
      <div className="h-10 w-48 bg-zinc-900 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-900/50 rounded-3xl animate-pulse" />)}
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
      <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-8 text-center max-w-sm">
        <p className="text-white font-bold mb-2">Ops!</p>
        <p className="text-zinc-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
