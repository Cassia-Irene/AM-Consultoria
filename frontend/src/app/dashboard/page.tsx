'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Pendencia } from '@/domain/pendencia'
import type { Visita } from '@/domain/visita'
import { getFaturamentoMaisRecente, getStatusFaturamento } from '@/domain/faturamento'
import { getTopPrioridade } from '@/lib/prioritizer'
import type { InsightPrioridade } from '@/domain/insight'
import { DashboardService, type DashboardResponse } from '@/services/dashboard.service'

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

function parsePrazoDate(prazo: string): Date {
  const parts = prazo.split('/')
  if (parts.length === 3) {
    const [dia, mes, ano] = parts.map(Number)
    return new Date(ano, mes - 1, dia)
  }
  return new Date(prazo)
}

function getDiffDias(prazo: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const p = parsePrazoDate(prazo)
  p.setHours(0, 0, 0, 0)
  return Math.ceil((p.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function getPrioridade(p: Pendencia): 'urgente' | 'atencao' | 'normal' {
  if (!p.prazo) return 'normal'
  const diff = getDiffDias(p.prazo)
  if (diff < 0) return 'urgente'
  if (diff <= 2) return 'atencao'
  return 'normal'
}

function labelPrazo(prazo: string): string {
  const diff = getDiffDias(prazo)
  if (diff < 0) return diff === -1 ? 'ontem' : `${Math.abs(diff)}d atrás`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return `em ${diff}d`
}

/* ─────────────────────────────────────────────
   BLOCO 1 — DECISÃO (TOP 1 DO DIA)
   A única coisa que importa agora. Ocupa espaço, grita, guia.
───────────────────────────────────────────── */

function DecisaoCard({ insight }: { insight: InsightPrioridade }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-red-950 to-[#1a0000] border border-red-900/60 shadow-xl shadow-red-950/40">
      {/* Indicador pulsante */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          {insight.atraso ? 'Atrasado' : 'Urgente'} · {insight.prazoLabel}
        </span>
      </div>

      <div className="px-5 pt-5 pb-4">
        {/* Label da seção */}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-3">
          ▶ Agir agora
        </p>

        {/* Título da ação — domina o card */}
        <h2 className="text-white text-xl font-black leading-tight mb-1">
          {insight.titulo}
        </h2>

        <p className="text-[#7D8597] text-sm">{insight.clienteNome}</p>
      </div>

      {/* Ação primária — ocupa toda a largura */}
      <Link href={insight.href} className="block mx-4 mb-5 active:scale-[0.98] transition-transform">
        <div className="bg-red-600 active:bg-red-700 text-white text-sm font-bold text-center rounded-xl py-3.5 flex items-center justify-center gap-2">
          Resolver agora
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </Link>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BLOCO 2 — AÇÃO IMEDIATA (outros urgentes)
   Agrupados por cliente para reduzir carga mental.
───────────────────────────────────────────── */

/** Card compacto de urgência com botão de ação inline */
function AcaoCard({ p, clienteNome }: { p: Pendencia; clienteNome: string }) {
  return (
    <Link href={`/pendencias/${p.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3 bg-[#0d1117] border-l-4 border-red-500 rounded-r-2xl px-4 py-3.5 min-h-[64px]">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] leading-tight truncate">{p.titulo}</p>
          <p className="text-[#7D8597] text-xs mt-0.5 truncate">{clienteNome}</p>
        </div>
        <div className="shrink-0 text-right flex items-center gap-2">
          <span className="text-red-400 text-xs font-bold tabular-nums">
            {p.prazo ? labelPrazo(p.prazo) : '—'}
          </span>
          <svg className="text-[#23272F]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

/** Grupo de pendências por cliente — reduz carga cognitiva */
function GrupoCliente({ clienteNome, pendencias }: { clienteNome: string; pendencias: Pendencia[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8597] px-1 mb-1.5">
        {clienteNome}
      </p>
      <div className="space-y-1.5">
        {pendencias.map(p => <AcaoCard key={p.id} p={p} clienteNome={clienteNome} />)}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BLOCO 3 — ALERTAS (vencendo em breve)
───────────────────────────────────────────── */

function AlertaCard({ p, clienteNome }: { p: Pendencia; clienteNome: string }) {
  return (
    <Link href={`/pendencias/${p.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3 bg-[#0d1117] border-l-4 border-amber-400 rounded-r-2xl px-4 py-3 min-h-[56px]">
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-semibold leading-tight truncate">{p.titulo}</p>
          <p className="text-[#7D8597] text-xs mt-0.5 truncate">{clienteNome}</p>
        </div>
        <span className="shrink-0 text-amber-400 text-xs font-bold tabular-nums">
          {p.prazo ? labelPrazo(p.prazo) : '—'}
        </span>
        <svg className="shrink-0 text-[#23272F]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}

/** Pendência inline — usada dentro do card de visita */
function PendenciaInline({ p }: { p: Pendencia }) {
  const prio = getPrioridade(p)
  const dotColor  = prio === 'urgente' ? 'bg-red-500' : prio === 'atencao' ? 'bg-amber-400' : 'bg-[#7D8597]'
  const textColor = prio === 'urgente' ? 'text-red-400' : prio === 'atencao' ? 'text-amber-400' : 'text-[#7D8597]'

  return (
    <Link href={`/pendencias/${p.id}`} className="flex items-start gap-2 py-1 active:opacity-70">
      <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dotColor}`} />
      <p className="text-[#979DAC] text-xs flex-1 leading-snug">{p.titulo}</p>
      {p.prazo && (
        <p className={`shrink-0 text-[10px] font-bold tabular-nums ${textColor}`}>
          {labelPrazo(p.prazo)}
        </p>
      )}
    </Link>
  )
}

/* ─────────────────────────────────────────────
   BLOCO 4 — ROTINA (visitas do dia)
───────────────────────────────────────────── */

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
  const temUrgente    = pendenciasAbertas.some(p => getPrioridade(p) === 'urgente')

  return (
    <div className="bg-[#001845] border border-[#002855] rounded-2xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-sky-400 mb-0.5">
            <span className="size-1.5 rounded-full bg-sky-400" /> Hoje
          </span>
          <p className="text-white font-semibold text-[15px] leading-tight truncate">{clienteNome}</p>
          {v.data_visita && <p className="text-[#7D8597] text-xs mt-0.5">{new Date(v.data_visita).toLocaleDateString('pt-BR')}</p>}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {statusPagamento ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              statusPagamento === 'pago'
                ? 'bg-emerald-900/50 text-emerald-400'
                : 'bg-amber-900/50 text-amber-400'
            }`}>
              {statusPagamento === 'pago' ? '✓ Pago' : '$ Pendente'}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#23272F] text-[#7D8597]">
              Sem dados
            </span>
          )}
          {temPendencias && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
              temUrgente ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
            }`}>
              {pendenciasAbertas.length}p. aberta{pendenciasAbertas.length > 1 ? 's' : ''}
              {temUrgente ? ' ⚠' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Contexto da última visita */}
      {v.observacoes && (
        <div className="mx-4 mb-3 bg-[#002855]/50 rounded-xl px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7D8597] mb-1">
            Última visita {v.ultimaVisitaEm ? `· ${v.ultimaVisitaEm}` : ''}
          </p>
          <p className="text-[#979DAC] text-xs leading-snug">{v.observacoes}</p>
        </div>
      )}

      {/* Pendências em aberto deste cliente */}
      {temPendencias && (
        <div className="mx-4 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7D8597] mb-1">
            Em aberto ({pendenciasAbertas.length})
          </p>
          <div className="divide-y divide-[#002855]">
            {pendenciasAbertas.map(p => (
              <PendenciaInline key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Ação */}
      <Link href={`/visitas/nova?clienteId=${v.clienteId}`} className="block mx-4 mb-4 active:scale-[0.98] transition-transform">
        <div className="bg-[#0466C8] text-white text-sm font-semibold text-center rounded-xl py-3">
          Registrar visita
        </div>
      </Link>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */

function SectionHeader({ label, count, cor }: { label: string; count?: number; cor?: 'red' | 'amber' | 'sky' | 'default' }) {
  const colors = {
    red:     'text-red-500',
    amber:   'text-amber-400',
    sky:     'text-sky-400',
    default: 'text-[#7D8597]',
  }
  const c = colors[cor ?? 'default']

  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <p className={`text-[11px] font-black uppercase tracking-widest ${c}`}>{label}</p>
      {count !== undefined && (
        <span className={`text-[11px] font-bold tabular-nums ${c}`}>{count}</span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   DASHBOARD — MODO CAOS
───────────────────────────────────────────── */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    DashboardService.getDashboardData().then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error('[ERROR][UI] Falha ao carregar dashboard modo caos:', err)
      setError('Não foi possível carregar alguns dados. O painel está operando em modo de segurança.')
      setData({ pendencias: [], clientes: [], contratos: [], faturamentos: [], visitas: [], projetos: [] })
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <p className="text-[#7D8597]">Carregando dashboard...</p>
      </main>
    )
  }

  /* ── dados ── */
  const { pendencias, visitas, contratos, faturamentos, clientes } = data
  const abertas    = pendencias.filter(p => p.status !== 'concluida')

  const urgentes = abertas
    .filter(p => getPrioridade(p) === 'urgente')
    .sort((a, b) => getDiffDias(a.prazo ?? '') - getDiffDias(b.prazo ?? ''))

  const atencao = abertas
    .filter(p => getPrioridade(p) === 'atencao')
    .sort((a, b) => getDiffDias(a.prazo ?? '') - getDiffDias(b.prazo ?? ''))

  /* ── lookups ── */
  const clienteNomePorId = new Map<string, string>()
  clientes.forEach(c => clienteNomePorId.set(c.id, c.nome_instituicao))

  const pendenciasPorCliente = new Map<string, Pendencia[]>()
  abertas.forEach(p => {
    const lista = pendenciasPorCliente.get(p.clienteId) ?? []
    lista.push(p)
    pendenciasPorCliente.set(p.clienteId, lista)
  })

  // Status de pagamento vem de FaturamentoCliente, não de Contrato
  const pagamentoPorCliente = new Map<string, 'pago' | 'pendente' | 'atrasado'>()
  contratos.forEach(c => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    if (fat) pagamentoPorCliente.set(c.clienteId, getStatusFaturamento(fat))
  })

  /* ── TOP 1 ── */
  const top1 = getTopPrioridade(abertas, clienteNomePorId)

  /* ── urgentes restantes (sem o top1) ── */
  const urgentesRest = urgentes.filter(p => p.id !== top1?.entidadeId)

  /* ── agrupamento por cliente para bloco 2 ── */
  const urgentesGrupo = new Map<string, Pendencia[]>()
  urgentesRest.forEach(p => {
    const lista = urgentesGrupo.get(p.clienteId) ?? []
    lista.push(p)
    urgentesGrupo.set(p.clienteId, lista)
  })

  /* ── header ── */
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
  const tudo_ok = urgentes.length === 0 && atencao.length === 0 && visitas.length === 0

  return (
    <main className="min-h-screen bg-[#07090D] pb-36">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-[#07090D]/95 backdrop-blur-sm px-5 pt-10 pb-3 flex items-baseline justify-between border-b border-[#23272F]">
        <h1 className="text-white text-base font-bold tracking-tight">Modo Caos</h1>
        <div className="flex items-center gap-3">
          <p className="text-[#7D8597] text-xs capitalize">{hoje}</p>
          <Link href="/dashboard/planejamento" className="text-[11px] text-[#0466C8] font-semibold">
            Planejamento →
          </Link>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-4 bg-amber-950/40 border border-amber-700/50 rounded-xl px-4 py-3 text-amber-400 text-sm">
          <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Aviso</p>
          {error}
        </div>
      )}

      <div className="px-4 pt-5 space-y-6">

        {/* ━━━━ BLOCO 1: DECISÃO ━━━━ */}
        {top1 && (
          <section>
            <DecisaoCard insight={top1} />
          </section>
        )}

        {/* ━━━━ BLOCO 2: AÇÃO IMEDIATA ━━━━ */}
        {urgentesRest.length > 0 && (
          <section>
            <SectionHeader label="Ação imediata" count={urgentesRest.length} cor="red" />
            <div className="space-y-4">
              {Array.from(urgentesGrupo.entries()).map(([clienteId, items]) => (
                <GrupoCliente 
                  key={clienteId} 
                  clienteNome={clienteNomePorId.get(clienteId) || clienteId} 
                  pendencias={items} 
                />
              ))}
            </div>
          </section>
        )}

        {/* ━━━━ BLOCO 3: ALERTAS ━━━━ */}
        {atencao.length > 0 && (
          <section>
            <SectionHeader label="Vencem em breve" count={atencao.length} cor="amber" />
            <div className="space-y-1.5">
              {atencao.map(p => <AlertaCard key={p.id} p={p} clienteNome={clienteNomePorId.get(p.clienteId) || p.clienteId} />)}
            </div>
          </section>
        )}

        {/* ━━━━ BLOCO 4: ROTINA ━━━━ */}
        {visitas.length > 0 && (
          <section>
            <SectionHeader label="Visitas hoje" count={visitas.length} cor="sky" />
            <div className="space-y-3">
              {visitas.map(v => {
                const nome = clienteNomePorId.get(v.clienteId) ?? v.clienteId
                return (
                  <VisitaRotinaCard
                    key={v.id}
                    v={v}
                    clienteNome={nome}
                    pendenciasAbertas={pendenciasPorCliente.get(v.clienteId) ?? []}
                    statusPagamento={pagamentoPorCliente.get(v.clienteId)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* TUDO EM DIA */}
        {tudo_ok && (
          <div className="mt-20 text-center">
            <p className="text-5xl">✅</p>
            <p className="text-white font-semibold mt-4">Tudo em dia</p>
            <p className="text-[#7D8597] text-sm mt-1">Nenhuma urgência ou visita hoje.</p>
          </div>
        )}

      </div>

      {/* DOIS FABs */}
      <div className="fixed bottom-6 inset-x-4 flex justify-between gap-3 pointer-events-none">
        <Link href="/pendencias/nova" className="pointer-events-auto flex-1">
          <div className="bg-[#23272F] active:bg-[#07090D] transition-colors text-white text-sm font-bold text-center px-4 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Pendência
          </div>
        </Link>
        <Link href="/visitas/nova" className="pointer-events-auto flex-1">
          <div className="bg-[#0466C8] active:bg-[#0353A4] transition-colors text-white text-sm font-bold text-center px-4 py-4 rounded-2xl shadow-2xl shadow-blue-950/50 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Visita
          </div>
        </Link>
      </div>

    </main>
  )
}