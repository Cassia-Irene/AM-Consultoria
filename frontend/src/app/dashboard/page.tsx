'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type TimelineEvent, 
  type TopPriority 
} from '@/services/analytics.service'
import { DashboardTabs } from '@/components/DashboardTabs'

// --- Componentes Locais ---

function SectionHeader({ label, count, cor }: { label: string; count?: number; cor: 'red' | 'sky' }) {
  const dotColor = cor === 'red' ? 'bg-red-500' : 'bg-sky-500'
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7D8597]">{label}</h2>
        {count !== undefined && <span className="text-[11px] text-[#4A5568] font-bold">({count})</span>}
      </div>
    </div>
  )
}

function DecisaoCard({ item }: { item: TopPriority }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-red-950 to-[#1a0000] border border-red-900/60 shadow-xl shadow-red-950/40">
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          {item.statusPrazo} · {item.dataPrazo ? labelPrazo(item.dataPrazo) : ''}
        </span>
      </div>

      <div className="p-6">
        <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.15em] mb-2">Decisão Crítica</p>
        <h3 className="text-white text-xl font-black leading-tight tracking-tight mb-4 pr-12">
          {item.titulo}
        </h3>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="size-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-red-500 text-[10px] font-bold">!</span>
          </div>
          <span className="text-zinc-400 text-xs font-medium">{item.cliente}</span>
        </div>

        <Link href={`/pendencias/${item.id}`} className="block">
          <div className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold text-center rounded-xl py-3.5 transition-colors shadow-lg shadow-red-900/20">
            Agir agora
          </div>
        </Link>
      </div>
    </div>
  )
}

function AcaoCard({ item }: { item: TopPriority }) {
  return (
    <Link href={`/pendencias/${item.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3 bg-[#0d1117] border-l-4 border-red-500 rounded-r-2xl px-4 py-3 min-h-[64px]">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] leading-tight truncate">{item.titulo}</p>
          <p className="text-[#7D8597] text-[10px] mt-0.5 truncate">{item.cliente}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-red-400 text-xs font-bold tabular-nums">
            {item.dataPrazo ? labelPrazo(item.dataPrazo) : '—'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function VisitaRotinaCard({ event }: { event: TimelineEvent }) {
  const statusPagamento = event.statusPagamento
  const pendenciasCount = event.pendenciasContagem || 0
  const ultimaVisita = event.ultimaVisitaResultados

  return (
    <div className="bg-[#001845] border border-[#002855] rounded-2xl overflow-hidden shadow-lg">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="size-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Hoje</span>
          </div>
          <h3 className="text-white font-black text-[17px] leading-tight tracking-tight truncate">{event.cliente}</h3>
          <p className="text-[#7D8597] text-[11px] font-bold mt-1">
            {new Date(event.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {statusPagamento && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              statusPagamento === 'pago' ? 'bg-[#064e3b] text-[#10b981]' : 'bg-[#78350f] text-[#f59e0b]'
            }`}>
              {statusPagamento === 'pago' ? '✓ Pago' : '$ Pendente'}
            </span>
          )}
          {pendenciasCount > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#450a0a] text-[#ef4444] border border-red-900/30">
              {pendenciasCount} em aberto
            </span>
          )}
        </div>
      </div>

      {ultimaVisita && (
        <div className="mx-4 mb-4 p-3.5 bg-black/30 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-sky-400/70">Última Visita</span>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed italic line-clamp-3">
            &quot;{ultimaVisita}&quot;
          </p>
        </div>
      )}

      {/* Lista de Pendências em Aberto */}
      {event.pendenciasLista && event.pendenciasLista.length > 0 && (
        <div className="mx-4 mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#7D8597] mb-3">
            Em Aberto ({event.pendenciasLista.length})
          </p>
          <div className="space-y-2.5">
            {event.pendenciasLista.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-1 rounded-full bg-zinc-600 group-hover:bg-sky-500 transition-colors" />
                  <p className="text-zinc-400 text-[12px] font-medium truncate">{p.descricao}</p>
                </div>
                {p.dataPrazo && (
                  <span className="text-[10px] font-bold text-zinc-500 shrink-0 tabular-nums">
                    {labelPrazo(p.dataPrazo)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <Link href={`/visitas/nova?contratoId=${event.idContrato}`} className="block">
          <div className="bg-[#0466C8] hover:bg-[#0353A4] active:scale-[0.98] transition-all text-white text-[13px] font-black text-center rounded-xl py-3.5 shadow-lg shadow-blue-900/30 uppercase tracking-widest">
            Registrar visita
          </div>
        </Link>
      </div>
    </div>
  )
}

function GrupoCliente({ clienteNome, items }: { clienteNome: string; items: TopPriority[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[#4A5568] uppercase tracking-widest ml-1">{clienteNome}</p>
      <div className="space-y-2">
        {items.map(item => <AcaoCard key={item.id} item={item} />)}
      </div>
    </div>
  )
}

// --- Helper Functions ---

function labelPrazo(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const diff = d.getTime() - today.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return `atrasado ${Math.abs(days)}d`
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days}d`
}

// --- Page Component ---

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [priorities, setPriorities] = useState<TopPriority[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [s, t, p] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getTimeline(),
          AnalyticsService.getPriorities()
        ])
        setSummary(s)
        setTimeline(t)
        setPriorities(p)
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <span className="text-red-500 font-black tracking-widest text-xs uppercase animate-pulse">Entrando em Modo Caos...</span>
        </div>
      </div>
    )
  }

  const top1 = priorities[0]
  const otherPriorities = priorities.slice(1)
  
  const prioritiesByClient = otherPriorities.reduce((acc, curr) => {
    if (!acc.has(curr.cliente)) acc.set(curr.cliente, [])
    acc.get(curr.cliente)!.push(curr)
    return acc
  }, new Map<string, TopPriority[]>())

  const visitsToday = timeline.filter(e => {
    if (e.tipo !== 'visita') return false
    const d = new Date(e.data)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <div className="px-4 pt-5 space-y-6">
        {top1 && <DecisaoCard item={top1} />}

        {otherPriorities.length > 0 && (
          <section>
            <SectionHeader label="Ações Imediatas" count={otherPriorities.length} cor="red" />
            <div className="space-y-4">
              {Array.from(prioritiesByClient.entries()).map(([cliente, items]) => (
                <GrupoCliente key={cliente} clienteNome={cliente} items={items} />
              ))}
            </div>
          </section>
        )}

        {visitsToday.length > 0 && (
          <section>
            <SectionHeader label="Visitas Hoje" count={visitsToday.length} cor="sky" />
            <div className="space-y-3">
              {visitsToday.map((v, i) => <VisitaRotinaCard key={i} event={v} />)}
            </div>
          </section>
        )}

        {!top1 && otherPriorities.length === 0 && visitsToday.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-600 text-sm font-medium">Nenhuma urgência detectada.</p>
            <p className="text-zinc-800 text-[10px] font-black uppercase mt-1">Ambiente sob controle</p>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
        <div className="max-w-md mx-auto flex gap-6">
          <Link href="/pendencias/nova" className="flex-1">
            <div className="bg-[#0d1117] hover:bg-zinc-900 border border-zinc-800 text-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-[0.98]">
              <div className="size-5 rounded-md border-2 border-white/60 flex items-center justify-center font-bold text-xs">+</div>
              <span className="text-[13px] font-black uppercase tracking-widest">Pendência</span>
            </div>
          </Link>
          
          <Link href="/visitas/nova" className="flex-1">
            <div className="bg-[#0466C8] hover:bg-[#0353A4] text-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-2xl shadow-blue-900/40 transition-all active:scale-[0.98]">
              <div className="size-5 rounded-md border-2 border-white/60 flex items-center justify-center font-bold text-xs">+</div>
              <span className="text-[13px] font-black uppercase tracking-widest">Visita</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}