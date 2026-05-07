'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Pendencia } from '@/domain/pendencia'
import type { Visita } from '@/domain/visita'
import { getFaturamentoMaisRecente, getStatusFaturamento } from '@/domain/faturamento'
import { getTopPrioridade } from '@/lib/prioritizer'
import type { InsightPrioridade } from '@/domain/insight'
import { AnalyticsService, type OperationalInsight } from '@/services/analytics.service'
import { getPendenciaSeveridade } from '@/utils/pendencia'
import { getDiffDias, isToday } from '@/utils/date'
import { DashboardTabs } from '@/components/DashboardTabs'

function labelPrazo(prazo: string): string {
  const diff = getDiffDias(prazo)
  if (diff < 0) return diff === -1 ? 'ontem' : `${Math.abs(diff)}d atrás`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return `em ${diff}d`
}

/* ─────────────────────────────────────────────
   COMPONENTES MODO CAOS
───────────────────────────────────────────── */

function DecisaoCard({ insight }: { insight: InsightPrioridade }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-red-950 to-[#1a0000] border border-red-900/60 shadow-xl shadow-red-950/40">
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          {insight.atraso ? 'Atrasado' : 'Urgente'} · {insight.prazoLabel}
        </span>
      </div>

      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-3">▶ Agir agora</p>
        <h2 className="text-white text-xl font-black leading-tight mb-1">{insight.titulo}</h2>
        <p className="text-[#7D8597] text-sm">{insight.clienteNome}</p>
      </div>

      <Link href={insight.href} className="block mx-4 mb-5 active:scale-[0.98] transition-transform">
        <div className="bg-red-600 active:bg-red-700 text-white text-sm font-bold text-center rounded-xl py-3.5 flex items-center justify-center gap-2">
          Resolver agora
        </div>
      </Link>
    </div>
  )
}

function AcaoCard({ p, clienteNome }: { p: Pendencia; clienteNome: string }) {
  return (
    <Link href={`/pendencias/${p.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3 bg-[#0d1117] border-l-4 border-red-500 rounded-r-2xl px-3 py-3 sm:px-4 sm:py-3.5 min-h-[60px] sm:min-h-[64px]">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13px] sm:text-[14px] leading-tight truncate">{p.descricao}</p>
          <p className="text-[#7D8597] text-[10px] sm:text-xs mt-0.5 truncate">{clienteNome}</p>
        </div>
        <div className="shrink-0 text-right flex items-center gap-2">
          <span className="text-red-400 text-[10px] sm:text-xs font-bold tabular-nums">
            {p.data_prazo ? labelPrazo(p.data_prazo) : '—'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function GrupoCliente({ clienteNome, pendencias }: { clienteNome: string; pendencias: Pendencia[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8597] px-1 mb-1.5">{clienteNome}</p>
      <div className="space-y-1.5">
        {pendencias.map(p => <AcaoCard key={p.id} p={p} clienteNome={clienteNome} />)}
      </div>
    </div>
  )
}

function AlertaCard({ p, clienteNome }: { p: Pendencia; clienteNome: string }) {
  return (
    <Link href={`/pendencias/${p.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3 bg-[#0d1117] border-l-4 border-amber-400 rounded-r-2xl px-4 py-3 min-h-[56px]">
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-semibold leading-tight truncate">{p.descricao}</p>
          <p className="text-[#7D8597] text-xs mt-0.5 truncate">{clienteNome}</p>
        </div>
        <span className="shrink-0 text-amber-400 text-xs font-bold tabular-nums">
          {p.data_prazo ? labelPrazo(p.data_prazo) : '—'}
        </span>
      </div>
    </Link>
  )
}

function VisitaRotinaCard({
  v,
  clienteNome,
  pendenciasAbertas,
  statusPagamento,
}: {
  v: Visita
  clienteNome: string
  pendenciasAbertas: Pendencia[]
  statusPagamento?: 'pago' | 'pendente' | 'atrasado'
}) {
  const temPendencias = pendenciasAbertas.length > 0
  const temUrgente    = pendenciasAbertas.some(p => getPendenciaSeveridade(p) === 'urgente')

  return (
    <div className="bg-[#001845] border border-[#002855] rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-sky-400 mb-0.5">
            <span className="size-1.5 rounded-full bg-sky-400" /> Hoje
          </span>
          <p className="text-white font-semibold text-[15px] leading-tight truncate">{clienteNome}</p>
          {v.data_hora && <p className="text-[#7D8597] text-xs mt-0.5">{new Date(v.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {statusPagamento && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              statusPagamento === 'pago' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'
            }`}>
              {statusPagamento === 'pago' ? '✓ Pago' : '$ Pendente'}
            </span>
          )}
          {temPendencias && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              temUrgente ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
            }`}>
              {pendenciasAbertas.length}p. aberta{pendenciasAbertas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <Link href={`/visitas/nova?contratoId=${v.contratoId}`} className="block mx-4 mb-4">
        <div className="bg-[#0466C8] text-white text-sm font-semibold text-center rounded-xl py-3">
          Registrar visita
        </div>
      </Link>
    </div>
  )
}

function SectionHeader({ label, count, cor }: { label: string; count?: number; cor?: 'red' | 'amber' | 'sky' }) {
  const colors = { red: 'text-red-500', amber: 'text-amber-400', sky: 'text-sky-400' }
  const c = colors[cor ?? 'sky']
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <p className={`text-[11px] font-black uppercase tracking-widest ${c}`}>{label}</p>
      {count !== undefined && <span className={`text-[11px] font-bold tabular-nums ${c}`}>{count}</span>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<OperationalInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    AnalyticsService.getOperationalSnapshot().then(res => {
      if (isMounted) {
        setData(res)
        setLoading(false)
      }
    })
    return () => { isMounted = false }
  }, [])

  if (loading || !data) return null

  const { pendencias, visitas, contratos, faturamentos, clientes } = data
  const abertas = pendencias.filter(p => !p.resolvida)
  const clienteNomePorId = new Map<string, string>()
  clientes.forEach(c => clienteNomePorId.set(c.id, c.nome_instituicao))
  const getClienteId = (p: Pendencia) => contratos.find(c => c.id === p.contratoId)?.clienteId ?? ''
  
  const pendenciasPorCliente = new Map<string, Pendencia[]>()
  abertas.forEach(p => {
    const cid = getClienteId(p)
    if (cid) {
      const lista = pendenciasPorCliente.get(cid) ?? []
      lista.push(p)
      pendenciasPorCliente.set(cid, lista)
    }
  })

  const pagamentoPorCliente = new Map<string, 'pago' | 'pendente' | 'atrasado'>()
  contratos.forEach(c => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    if (fat) pagamentoPorCliente.set(c.clienteId, getStatusFaturamento(fat))
  })

  const top1 = getTopPrioridade(abertas, p => clienteNomePorId.get(getClienteId(p)) ?? 'Cliente')
  const urgentesRest = abertas.filter(p => getPendenciaSeveridade(p) === 'urgente' && p.id !== top1?.entidadeId)
  const atencao = abertas.filter(p => getPendenciaSeveridade(p) === 'atencao')
  const visitasHoje = visitas.filter(v => isToday(v.data_hora))

  const urgentesGrupo = new Map<string, Pendencia[]>()
  urgentesRest.forEach(p => {
    const cid = getClienteId(p)
    if (cid) {
      const lista = urgentesGrupo.get(cid) ?? []
      lista.push(p)
      urgentesGrupo.set(cid, lista)
    }
  })

  return (
    <main className="min-h-screen bg-[#07090D] pb-36">
      <DashboardTabs />

      <div className="px-4 pt-5 space-y-6">
        {top1 && <DecisaoCard insight={top1} />}

        {urgentesRest.length > 0 && (
          <section>
            <SectionHeader label="Ação Imediata" count={urgentesRest.length} cor="red" />
            <div className="space-y-4">
              {Array.from(urgentesGrupo.entries()).map(([cid, items]) => (
                <GrupoCliente key={cid} clienteNome={clienteNomePorId.get(cid) || cid} pendencias={items} />
              ))}
            </div>
          </section>
        )}

        {atencao.length > 0 && (
          <section>
            <SectionHeader label="Vencem em Breve" count={atencao.length} cor="amber" />
            <div className="space-y-1.5">
              {atencao.map(p => <AlertaCard key={p.id} p={p} clienteNome={clienteNomePorId.get(getClienteId(p)) || 'Cliente'} />)}
            </div>
          </section>
        )}

        {visitasHoje.length > 0 && (
          <section>
            <SectionHeader label="Visitas Hoje" count={visitasHoje.length} cor="sky" />
            <div className="space-y-3">
              {visitasHoje.map(v => {
                const cid = contratos.find(c => c.id === v.contratoId)?.clienteId || ''
                return (
                  <VisitaRotinaCard
                    key={v.id}
                    v={v}
                    clienteNome={clienteNomePorId.get(cid) || 'Cliente'}
                    pendenciasAbertas={pendenciasPorCliente.get(cid) ?? []}
                    statusPagamento={pagamentoPorCliente.get(cid)}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-6 inset-x-4 flex justify-between gap-3 pointer-events-none">
        <Link href="/pendencias/nova" className="pointer-events-auto flex-1">
          <div className="bg-[#23272F] text-white text-sm font-bold text-center py-4 rounded-2xl shadow-xl">Pendência</div>
        </Link>
        <Link href="/visitas/nova" className="pointer-events-auto flex-1">
          <div className="bg-[#0466C8] text-white text-sm font-bold text-center py-4 rounded-2xl shadow-xl">Visita</div>
        </Link>
      </div>
    </main>
  )
}