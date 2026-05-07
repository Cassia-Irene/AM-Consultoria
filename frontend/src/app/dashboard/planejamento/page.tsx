'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Pendencia } from '@/domain/pendencia'
import { getFaturamentoMaisRecente, getStatusFaturamento } from '@/domain/faturamento'
import { DashboardService, type DashboardResponse } from '@/services/dashboard.service'
import { getPendenciaSeveridade } from '@/utils/pendencia'
import { getDiffDias } from '@/utils/date'
import { DashboardTabs } from '@/components/DashboardTabs'

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function labelPrazo(prazo: string): string {
  const diff = getDiffDias(prazo)
  if (diff < 0) return diff === -1 ? 'ontem' : `${Math.abs(diff)}d atrás`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return `em ${diff}d`
}

function formatValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

/* ─────────────────────────────────────────────
   COMPONENTES PLANEJAMENTO (ORGANIZAÇÃO)
───────────────────────────────────────────── */

function SectionHeader({ label, sub, count }: { label: string; sub?: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between px-1 mb-2">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#7D8597]">{label}</p>
        {count !== undefined && <span className="text-[10px] text-[#4F5B73] font-bold tabular-nums">({count})</span>}
      </div>
      {sub && <p className="text-[10px] text-[#7D8597]">{sub}</p>}
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'red' | 'amber' | 'green' | 'blue'
}) {
  const color = {
    red:   'text-red-400',
    amber: 'text-amber-400',
    green: 'text-emerald-400',
    blue:  'text-sky-400',
  }[accent ?? 'blue'] ?? 'text-white'

  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-3 py-3 sm:px-4 sm:py-4 shadow-lg shadow-black/20">
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#7D8597]">{label}</p>
      <p className={`text-xl sm:text-2xl font-black tabular-nums leading-none mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[9px] sm:text-[10px] text-[#7D8597] mt-1.5 leading-tight">{sub}</p>}
    </div>
  )
}

function CapacityCard({ label, value, sub, progress }: { label: string; value: string; sub: string; progress: number }) {
  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-3xl p-5 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7D8597] mb-1">{label}</p>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] text-[#7D8597] font-bold uppercase">{sub}</p>
      </div>
      <div className="h-1.5 bg-[#23272F] rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.4)]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function PriorityCard({ p, clienteNome, cor }: { p: Pendencia; clienteNome: string; cor: 'red' | 'amber' | 'default' }) {
  const borderColor = cor === 'red' ? 'border-red-500' : cor === 'amber' ? 'border-amber-400' : 'border-[#23272F]'
  const prazoColor  = cor === 'red' ? 'text-red-400' : cor === 'amber' ? 'text-amber-400' : 'text-[#7D8597]'

  return (
    <Link href={`/pendencias/${p.id}`} className="block active:scale-[0.98] transition-transform">
      <div className={`flex items-center gap-3 bg-[#0d1117] border-l-4 ${borderColor} rounded-r-2xl px-4 py-3 min-h-[60px]`}>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] leading-tight truncate">{p.descricao}</p>
          <p className="text-[#7D8597] text-xs mt-0.5 truncate">{clienteNome}</p>
        </div>
        <p className={`shrink-0 text-xs font-bold tabular-nums ${prazoColor}`}>
          {p.data_prazo ? labelPrazo(p.data_prazo) : '—'}
        </p>
      </div>
    </Link>
  )
}

/* ─────────────────────────────────────────────
   PÁGINA DASHBOARD — MODO PLANEJAMENTO
───────────────────────────────────────────── */

export default function DashboardPlanejamentoPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    DashboardService.getDashboardData().then(res => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) return null

  const { pendencias, visitas, contratos, faturamentos, clientes } = data
  const abertas = pendencias.filter(p => !p.resolvida)
  const urgentes = abertas.filter(p => getPendenciaSeveridade(p) === 'urgente')
  const atencao = abertas.filter(p => getPendenciaSeveridade(p) === 'atencao')
  const normais = abertas.filter(p => getPendenciaSeveridade(p) === 'normal')
  
  const clienteNomePorId = new Map<string, string>()
  clientes.forEach(c => clienteNomePorId.set(c.id, c.nome_instituicao))

  const getClienteId = (p: Pendencia) => contratos.find(c => c.id === p.contratoId)?.clienteId ?? ''

  const totalPendente = contratos.reduce((acc, c) => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    return fat && getStatusFaturamento(fat) !== 'pago' ? acc + fat.valor_total : acc
  }, 0)
  
  const totalMes = contratos.reduce((acc, c) => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    return fat ? acc + fat.valor_total : acc
  }, 0)

  const capacidadeProgress = Math.min(100, (visitas.length / 15) * 100)

  return (
    <main className="min-h-screen bg-[#07090D] pb-36">
      <DashboardTabs />

      <div className="px-5 pt-6 space-y-10">
        
        {/* 1. VISÃO GERAL (4 CARDS) */}
        <section>
          <SectionHeader label="Visão Geral" />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Atrasados" value={urgentes.length} accent="red" />
            <MetricCard label="Atenção" value={atencao.length} accent="amber" />
            <MetricCard label="A Receber" value={formatValor(totalPendente)} sub={`de ${formatValor(totalMes)} no mês`} accent="amber" />
            <MetricCard label="Clientes Ativos" value={clientes.length} accent="blue" />
          </div>
        </section>

        {/* 2. CARGA DA SEMANA */}
        <section>
          <SectionHeader label="Carga Operacional" />
          <CapacityCard 
            label="Ocupação da Semana" 
            value={`${visitas.length} / 15`} 
            sub="Visitas agendadas" 
            progress={capacidadeProgress} 
          />
        </section>

        {/* 3. FOCO SEMANAL (DISTRIBUIÇÃO POR CLIENTE) */}
        <section>
          <SectionHeader label="Foco por Cliente" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            {clientes.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between bg-[#0d1117] rounded-2xl px-5 py-4 border border-[#23272F]">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold truncate">{c.nome_instituicao}</p>
                  <p className="text-[#7D8597] text-[10px] uppercase mt-0.5">Prioridade Semanal</p>
                </div>
                <div className="size-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.6)] shrink-0 ml-3" />
              </div>
            ))}
          </div>
        </section>

        {/* 4. PENDÊNCIAS POR PRIORIDADE */}
        <div className="space-y-6 pt-2">
          {urgentes.length > 0 && (
            <section>
              <SectionHeader label="Atrasados" count={urgentes.length} />
              <div className="space-y-2">
                {urgentes.map(p => <PriorityCard key={p.id} p={p} clienteNome={clienteNomePorId.get(getClienteId(p)) || 'Cliente'} cor="red" />)}
              </div>
            </section>
          )}

          {atencao.length > 0 && (
            <section>
              <SectionHeader label="Vencem em Breve" count={atencao.length} />
              <div className="space-y-2">
                {atencao.map(p => <PriorityCard key={p.id} p={p} clienteNome={clienteNomePorId.get(getClienteId(p)) || 'Cliente'} cor="amber" />)}
              </div>
            </section>
          )}

          {normais.length > 0 && (
            <section>
              <SectionHeader label="Demais Pendências" count={normais.length} />
              <div className="space-y-2">
                {normais.map(p => <PriorityCard key={p.id} p={p} clienteNome={clienteNomePorId.get(getClienteId(p)) || 'Cliente'} cor="default" />)}
              </div>
            </section>
          )}
        </div>

      </div>

      <div className="fixed bottom-8 inset-x-6 flex justify-between gap-4 pointer-events-none">
        <Link href="/pendencias/nova" className="pointer-events-auto flex-1">
          <div className="bg-[#23272F] text-white text-xs font-black uppercase tracking-widest text-center py-4 rounded-2xl shadow-xl">
            + Pendência
          </div>
        </Link>
        <Link href="/visitas/nova" className="pointer-events-auto flex-1">
          <div className="bg-[#0466C8] text-white text-xs font-black uppercase tracking-widest text-center py-4 rounded-2xl shadow-xl">
            + Visita
          </div>
        </Link>
      </div>
    </main>
  )
}
