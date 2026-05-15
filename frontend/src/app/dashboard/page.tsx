'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type TopPriority,
  type TodayVisit,
  type CaosScore
} from '@/services/analytics.service'

import { DashboardTabs } from '@/components/DashboardTabs'
import { VisitaRotinaCard } from '@/components/VisitaRotinaCard'
import { AttentionPanel } from '@/components/AttentionPanel'
import { type AttentionItem } from '@/services/analytics.service'

// --- Componentes Locais ---

function SectionHeader({ label, count, cor, href }: { label: string; count?: number; cor: 'red' | 'sky'; href?: string }) {
  const dotColor = cor === 'red' ? 'bg-red-500' : 'bg-sky-500'
  const content = (
    <div className="flex items-center gap-2 group cursor-pointer">
      <span className={`size-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform`} />
      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7D8597] group-hover:text-zinc-300 transition-colors">{label}</h2>
      {count !== undefined && <span className="text-[11px] text-[#4A5568] font-bold">({count})</span>}
      {href && (
        <svg className="text-[#4A5568] group-hover:text-sky-500 transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  )

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      {href ? <Link href={href}>{content}</Link> : content}
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

        <Link href={`/pendencias?id=${item.id}`} className="block">
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
    <Link href={`/pendencias?id=${item.id}`} className="block active:scale-[0.98] transition-transform">
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

function ClienteCriticoCard({ score }: { score: CaosScore }) {
  return (
    <div className="bg-[#0d1117] border border-red-900/40 rounded-2xl p-4 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-white text-sm font-bold truncate">{score.cliente}</p>
        <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-1">
          {score.visitasUrgentes} urgências · {score.pendenciasAtrasadas} atrasos
        </p>
      </div>
      <div className="text-right ml-4">
        <div className="text-rose-500 text-xl font-black">{score.totalAlertas}</div>
        <p className="text-[8px] text-rose-900 font-bold uppercase tracking-tighter">Alertas</p>
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
  const [visitsToday, setVisitsToday] = useState<TodayVisit[]>([])
  const [priorities, setPriorities] = useState<TopPriority[]>([])
  const [caosScores, setCaosScores] = useState<CaosScore[]>([])
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [s, today, p, cs, attention] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getTodayAgenda(),
          AnalyticsService.getPriorities(),
          AnalyticsService.getCaosScore(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/intelligence/attention`).then(r => r.json())
        ])
        setSummary(s)
        setVisitsToday(today)
        setPriorities(p)
        setCaosScores(cs.filter(c => c.totalAlertas > 3)) // Apenas os críticos
        setAttentionItems(attention)
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


  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <div className="px-4 pt-5 space-y-6">
        {top1 && <DecisaoCard item={top1} />}

        {caosScores.length > 0 && (
          <section>
            <SectionHeader label="Instabilidade Operacional" count={caosScores.length} cor="red" />
            <div className="space-y-3">
              {caosScores.map(cs => <ClienteCriticoCard key={cs.idContrato} score={cs} />)}
            </div>
          </section>
        )}

        {otherPriorities.length > 0 && (
          <section>
            <SectionHeader label="Ações Imediatas" count={otherPriorities.length} cor="red" href="/pendencias" />
            <div className="space-y-4">
              {Array.from(prioritiesByClient.entries()).map(([cliente, items]) => (
                <GrupoCliente key={cliente} clienteNome={cliente} items={items} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader label="Visitas Hoje" count={visitsToday.length} cor="sky" href="/dashboard/planejamento?tab=operacao" />
          <div className="space-y-3">
            {visitsToday.length > 0 ? (
              visitsToday.map((v, i) => <VisitaRotinaCard key={i} event={v} />)
            ) : (
              <div className="py-10 text-center bg-[#0d1117] rounded-3xl border border-dashed border-[#23272F]">
                <p className="text-[#4A5568] text-[11px] font-bold uppercase tracking-widest">Nenhuma visita agendada para hoje</p>
              </div>
            )}
          </div>
        </section>

        {!top1 && otherPriorities.length === 0 && visitsToday.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-zinc-600 text-sm font-medium">Nenhuma urgência detectada.</p>
            <p className="text-zinc-800 text-[10px] font-black uppercase mt-1">Ambiente sob controle</p>
          </div>
        )}
      </div>

      {/* 🆕 CAMADA DE ATENÇÃO GLOBAL */}
      {!loading && attentionItems.length > 0 && (
        <AttentionPanel 
          items={attentionItems} 
          onItemClick={(id: number) => {
            console.log('Click no contrato:', id)
          }}
        />
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
        <div className="max-w-md mx-auto flex gap-6">
          <Link href="/pendencias/nova" className="flex-1">
            <div className="bg-[#0d1117] hover:bg-zinc-900 border border-zinc-800 text-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-[0.98]">
              <div className="size-5 rounded-md border-2 border-white/60 flex items-center justify-center font-bold text-xs">+</div>
              <span className="text-[13px] font-black uppercase tracking-widest">Pendência</span>
            </div>
          </Link>
          
          <Link href="/visitas/escolha" className="flex-1">
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