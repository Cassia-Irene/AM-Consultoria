'use client'

import { useEffect, useState, useMemo, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type OpenPendency,
  type TodayVisit,
  type TimelineEvent
} from '@/services/analytics.service'
import { DashboardTabs } from '@/components/DashboardTabs'
import { VisitaRotinaCard } from '@/components/VisitaRotinaCard'
import { OperationalTabs, type TabOption } from '@/components/OperationalTabs'
import { displayDate } from '@/utils/date'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { PendenciaManager } from '@/components/PendenciaManager'
import { VisitaDetailView } from '@/components/VisitaDetailView'

type SubTab = 'organizacao' | 'operacao'

// --- Componentes de UI ---

function SectionHeader({ label, sub, count, href }: { label: string; sub?: string; count?: number; href?: string }) {
  const content = (
    <div className="flex items-center gap-2">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7D8597]">{label}</p>
      {count !== undefined && <span className="text-[11px] text-[#4A5568] font-bold">({count})</span>}
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 px-1 mb-4">
      {href ? (
        <Link href={href} className="hover:text-white transition-colors">{content}</Link>
      ) : content}
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

function PendenciaItem({ item, cor, onClick }: { item: OpenPendency; cor: 'red' | 'amber' | 'zinc'; onClick: () => void }) {
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
    <div 
      onClick={onClick}
      className="block active:scale-[0.98] transition-transform cursor-pointer"
    >
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
    </div>
  )
}

function HistoryItem({ event, onClick }: { event: TimelineEvent; onClick: () => void }) {
  const icon = {
    visita: '📅',
    pendencia: '📋',
    financeiro: '💰',
    alerta: '⚠️',
    projeto: '🚀'
  }[event.tipo] || '•'

  if (event.tipo === 'pendencia') return (
    <Link 
      href={`/pendencias?id=${event.idReferencia}&highlight=blue`}
      className="flex items-center gap-4 bg-[#0d1117]/50 border border-[#23272F]/50 rounded-2xl px-4 py-3 cursor-pointer hover:border-blue-500/40 hover:bg-[#0d1117]/80 transition-all"
    >
      <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-zinc-300 font-bold text-sm truncate">{event.titulo}</p>
        <p className="text-[#4A5568] text-[10px] font-black uppercase tracking-widest truncate">{event.cliente} · {displayDate(event.data)}</p>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">
        Ver Pendência
      </div>
    </Link>
  )

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 bg-[#0d1117]/50 border border-[#23272F]/50 rounded-2xl px-4 py-3 cursor-pointer hover:border-[#0466C8]/40 hover:bg-[#0d1117]/80 transition-all"
    >
      <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-zinc-300 font-bold text-sm truncate">{event.titulo}</p>
        <p className="text-[#4A5568] text-[10px] font-black uppercase tracking-widest truncate">{event.cliente} · {displayDate(event.data)}</p>
      </div>
      
      {/* Inline Pendencies (Point D) */}
      {event.pendenciasLista && event.pendenciasLista.length > 0 && (
        <div className="hidden lg:block shrink-0 max-w-[150px] border-l border-[#23272F] pl-4 ml-2">
          <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">Ações</p>
          <div className="space-y-1">
            {event.pendenciasLista.slice(0, 1).map((p, i) => (
              <p key={i} className="text-[9px] text-zinc-500 truncate leading-none">↳ {p.descricao}</p>
            ))}
            {event.pendenciasLista.length > 1 && (
              <p className="text-[8px] text-zinc-600 font-bold">+{event.pendenciasLista.length - 1} mais</p>
            )}
          </div>
        </div>
      )}

      <div className="text-[10px] font-black uppercase tracking-widest text-sky-500">
        Ver Log
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

function PlanningList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [visits, setVisits] = useState<TodayVisit[]>([])
  const [pendencies, setPendencies] = useState<OpenPendency[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [selectedItem, setSelectedItem] = useState<{ 
    type: 'visita' | 'pendencia'; 
    id: number | string;
    color?: 'amber' | 'zinc' | 'red'
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const activeTab = (searchParams.get('tab') as SubTab) || 'organizacao'

  const setActiveTab = (tab: SubTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/dashboard/planejamento?${params.toString()}`)
  }

  const loadData = useCallback(async () => {
    try {
      const [s, today, p, t] = await Promise.all([
        AnalyticsService.getSummary(),
        AnalyticsService.getWeeklyAgenda(),
        AnalyticsService.getPendencies(),
        AnalyticsService.getTimeline()
      ])
      setSummary(s)
      setVisits(today)
      setPendencies(p)
      setTimeline(t)
    } catch (err) {
      console.error('Erro no planejamento:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => loadData())
  }, [loadData])


  const atrasados = pendencies.filter(p => p.statusPrazo === 'atrasado')
  const emBreve = pendencies.filter(p => p.statusPrazo === 'hoje' || p.statusPrazo === 'breve')
  const demais = pendencies.filter(p => p.statusPrazo === 'planejado')

  const recentHistory = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return timeline
      .filter(e => new Date(e.data) <= now)
      .filter(e => new Date(e.data) >= sevenDaysAgo) // Higiene 15/7
      .slice(0, 15) // Higiene 15/7
  }, [timeline])

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-sky-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Organizando Estratégia...</span>
      </div>
    )
  }

  const tabOptions: TabOption<SubTab>[] = [
    { value: 'organizacao', label: 'Estratégia' },
    { value: 'operacao', label: 'Fluxo de Visitas' },
  ]

  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <div className="px-4 pt-6">
        <OperationalTabs 
          options={tabOptions} 
          currentValue={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      <div className="px-4 pt-2 space-y-8 animate-in fade-in duration-500">
        
        {activeTab === 'organizacao' ? (
          <>
            {/* VISÃO GERAL */}
            <section>
              <SectionHeader label="Carga Operacional" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Atrasados" value={atrasados.length} accent="red" />
                <MetricCard label="Atenção" value={emBreve.length} accent="amber" />
                <MetricCard label="A Receber" value={summary.inadimplenciaCount} accent="yellow" sub="Vencimentos" />
                <MetricCard label="Contratos" value={summary.contratosAtivos} accent="blue" sub="Em vigor" />
              </div>
            </section>

            {/* FUSÃO A + B (TRILHO OPERACIONAL) */}
            <div className="space-y-8">
              <section>
                <SectionHeader label="Próximas do Prazo" sub="Próximos 7 dias" />
                <div className="space-y-2">
                  {emBreve.length > 0 ? (
                    emBreve.map((p, i) => (
                      <PendenciaItem 
                        key={i} 
                        item={p} 
                        cor="amber" 
                        onClick={() => setSelectedItem({ type: 'pendencia', id: p.id, color: 'amber' })}
                      />
                    ))
                  ) : (
                    <p className="text-zinc-600 text-xs italic px-1">Nenhum compromisso para os próximos dias.</p>
                  )}
                </div>
              </section>

              {demais.length > 0 && (
                <section>
                  <SectionHeader label="Planejamento Futuro" sub="Próximas semanas" />
                  <div className="space-y-2">
                    {demais.map((p, i) => (
                      <PendenciaItem 
                        key={i} 
                        item={p} 
                        cor="zinc" 
                        onClick={() => setSelectedItem({ type: 'pendencia', id: p.id, color: 'zinc' })}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          <>
            {/* FLUXO DE VISITAS DA SEMANA (Visão Semanal) */}
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 px-1">
                <SectionHeader label="Fluxo da Semana" count={visits.length} sub="Previsibilidade" />
                <Link href="/visitas/escolha" className="w-fit text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 px-4 py-2 rounded-lg border border-sky-500/20 hover:bg-sky-500/20 transition-colors">
                  + Nova Visita
                </Link>
              </div>

              {visits.length > 0 ? (
                <div className="space-y-8">
                  {/* PRÓXIMOS DIAS (Visão Semanal de Planejamento) */}
                  {(() => {
                    const proximas = visits.filter(v => {
                      const label = labelPrazo(v.dataHora)
                      // Exclui hoje e passado para focar apenas em planejamento futuro
                      return label !== 'hoje' && label !== 'ontem' && !label.includes('atrás')
                    })
                    if (proximas.length === 0) return (
                      <div className="py-12 text-center bg-[#0d1117] rounded-3xl border border-dashed border-[#23272F]">
                        <p className="text-[#4A5568] text-sm font-bold uppercase tracking-widest">Sem visitas planejadas para os próximos dias</p>
                        <p className="text-[#4A5568] text-[10px] mt-1 font-medium">Sua carga para amanhã em diante está livre.</p>
                      </div>
                    )
                    return (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {proximas.map((v, i) => <VisitaRotinaCard key={i} event={v} compact />)}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="py-12 text-center bg-[#0d1117] rounded-3xl border border-dashed border-[#23272F]">
                  <p className="text-[#4A5568] text-sm font-bold uppercase tracking-widest">Nenhuma visita agendada</p>
                  <p className="text-[#4A5568] text-[10px] mt-1 font-medium">Use o botão acima para registrar fatos avulsos ou planejar a semana</p>
                </div>
              )}
            </section>

            {/* HISTÓRICO RECENTE (MEMÓRIA OPERACIONAL) */}
            <section>
              <SectionHeader label="Memória Operacional Recente" sub="Higiene 15/7" />
              <div className="space-y-3">
                {recentHistory.map((e, i) => (
                  <HistoryItem 
                    key={i} 
                    event={e} 
                    onClick={() => setSelectedItem({ type: 'visita', id: e.idReferencia })}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* DRAWER OPERACIONAL (Anti-ERP Continuity) */}
        <OperationalDrawer
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem?.type === 'visita' ? 'Gestão de Visita' : 'Gestão de Pendência'}
        >
          {selectedItem?.type === 'pendencia' ? (
            <PendenciaManager 
              id={selectedItem.id} 
              onUpdate={loadData} 
              highlightColor={selectedItem.color}
            />
          ) : selectedItem?.type === 'visita' ? (
            <VisitaDetailView id={selectedItem.id} />
          ) : (
            <div className="text-center py-10">
              <p className="text-zinc-600 text-xs italic">Selecione um item para operar.</p>
            </div>
          )}
        </OperationalDrawer>
      </div>
    </main>
  )
}

export default function PlanningPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090D]" />}>
      <PlanningList />
    </Suspense>
  )
}

