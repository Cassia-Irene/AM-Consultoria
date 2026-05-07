'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Pendencia } from '@/domain/pendencia'
import type { Visita } from '@/domain/visita'
import { getFaturamentoMaisRecente, getStatusFaturamento } from '@/domain/faturamento'
import { DashboardService, type DashboardResponse } from '@/services/dashboard.service'
import { getPendenciaSeveridade } from '@/utils/pendencia'
import { getDiffDias } from '@/utils/date'

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
   COMPONENTES
───────────────────────────────────────────── */

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between px-1 mb-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#7D8597]">{label}</p>
      {sub && <p className="text-[11px] text-[#7D8597]">{sub}</p>}
    </div>
  )
}

/** Métrica rápida — grid 2 colunas */
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
    <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8597]">{label}</p>
      <p className={`text-2xl font-black tabular-nums leading-none mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-[#7D8597] mt-0.5">{sub}</p>}
    </div>
  )
}

/** Card de pendência — compacto para modo planejamento */
function PriorityCard({ p, clienteNome }: { p: Pendencia; clienteNome: string }) {
  const prio = getPendenciaSeveridade(p)
  const isUrgente = prio === 'urgente'
  const borderColor = isUrgente ? 'border-red-500' : prio === 'atencao' ? 'border-amber-400' : 'border-[#23272F]'
  const prazoColor  = isUrgente ? 'text-red-400' : prio === 'atencao' ? 'text-amber-400' : 'text-[#7D8597]'

  return (
    <Link href={`/pendencias/${p.id}`} className="block active:scale-[0.98] transition-transform">
      <div className={`flex items-center gap-3 bg-[#0d1117] border-l-4 ${borderColor} rounded-r-2xl px-4 py-3 min-h-[60px]`}>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] leading-tight truncate">{p.descricao}</p>
          <p className="text-[#7D8597] text-xs mt-0.5 truncate">{clienteNome}</p>
        </div>
        {p.data_prazo && (
          <p className={`shrink-0 text-xs font-bold tabular-nums ${prazoColor}`}>
            {labelPrazo(p.data_prazo)}
          </p>
        )}
        <svg className="shrink-0 text-[#23272F]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}

/** Card de visita planejamento — mais compacto, foco em agenda */
function VisitaAgendaCard({
  v,
  clienteNome,
  pendenciasAbertas,
  statusPagamento,
  valorMes,
}: {
  v: Visita
  clienteNome: string
  pendenciasAbertas: Pendencia[]
  statusPagamento?: 'pago' | 'pendente' | 'atrasado'
  valorMes?: number
}) {
  const temPendencias = pendenciasAbertas.length > 0
  const pendUrgentes  = pendenciasAbertas.filter(p => getPendenciaSeveridade(p) === 'urgente').length

  return (
    <div className="bg-[#001233] border border-[#001845] rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        {/* Linha de cabeçalho */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white font-semibold text-[15px] leading-tight truncate">{clienteNome}</p>
            <p className="text-[#7D8597] text-xs mt-0.5">
              📍 {v.data_hora ? new Date(v.data_hora).toLocaleDateString('pt-BR') : 'Sem data'}
            </p>
          </div>

          {/* Sinais rápidos à direita */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {statusPagamento ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                statusPagamento === 'pago'
                  ? 'bg-emerald-900/50 text-emerald-400'
                  : 'bg-amber-900/50 text-amber-400'
              }`}>
                {statusPagamento === 'pago' ? '✓ Pago' : `$ ${valorMes ? formatValor(valorMes) : 'Pendente'}`}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#23272F] text-[#7D8597]">
                Sem dados
              </span>
            )}
            {temPendencias && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                pendUrgentes > 0 ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
              }`}>
                {pendenciasAbertas.length} pendência{pendenciasAbertas.length > 1 ? 's' : ''}
                {pendUrgentes > 0 ? ' ⚠' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Contexto da última visita */}
        {v.descricao && (
          <div className="mt-2 bg-[#001845]/60 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7D8597] mb-0.5">
              Resumo Operacional
            </p>
            <p className="text-[#979DAC] text-xs leading-snug">{v.descricao}</p>
          </div>
        )}
      </div>

      {/* Ação */}
      <Link
        href={`/visitas/nova?contratoId=${v.contratoId}`}
        className="block mx-4 mb-4 active:scale-[0.98] transition-transform"
      >
        <div className="bg-[#023E7D] text-white text-sm font-semibold text-center rounded-xl py-2.5">
          Registrar visita
        </div>
      </Link>
    </div>
  )
}

/* ─────────────────────────────────────────────
   DASHBOARD — MODO PLANEJAMENTO
   Foco: visão do dia com contexto financeiro e próximos passos
───────────────────────────────────────────── */

export default function DashboardPlanejamentoPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    DashboardService.getDashboardData().then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error('[ERROR][UI] Falha ao carregar dashboard planejamento:', err)
      setError('Não foi possível carregar alguns dados. O painel está operando em modo de segurança.')
      setData({ pendencias: [], clientes: [], contratos: [], faturamentos: [], visitas: [], projetos: [] })
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <p className="text-[#7D8597] text-sm animate-pulse">Carregando planejamento...</p>
      </main>
    )
  }

  const { pendencias, visitas, contratos, faturamentos, clientes } = data
  const abertas    = pendencias.filter(p => !p.resolvida)
  const urgentes   = abertas.filter(p => getPendenciaSeveridade(p) === 'urgente')
  const atencao    = abertas.filter(p => getPendenciaSeveridade(p) === 'atencao')
  const normais    = abertas.filter(p => getPendenciaSeveridade(p) === 'normal')

  // Lookup: ID numérico do cliente → nome
  const clientesLista = clientes
  const clienteNomePorId = new Map<string, string>()
  clientesLista.forEach(c => clienteNomePorId.set(c.id, c.nome_instituicao))

  const clientesAtivos = clientesLista.length // Simples count pra mock

  // Financeiro — via mapper tipado
  const totalPendente = contratos.reduce((acc, c) => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    return fat && getStatusFaturamento(fat) !== 'pago' ? acc + fat.valor_total : acc
  }, 0)

  const totalMes = contratos.reduce((acc, c) => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    return fat ? acc + fat.valor_total : acc
  }, 0)

  // Índices cruzados — chave = nome do cliente
  const getClienteId = (p: Pendencia) => contratos.find(c => c.id === p.contratoId)?.clienteId ?? ''

  const pendenciasPorCliente = new Map<string, Pendencia[]>()
  abertas.forEach(p => {
    const cid = getClienteId(p)
    if (!cid) return
    const lista = pendenciasPorCliente.get(cid) ?? []
    lista.push(p)
    pendenciasPorCliente.set(cid, lista)
  })

  const pagamentoPorCliente = new Map<string, 'pago' | 'pendente' | 'atrasado'>()
  const valorPorCliente     = new Map<string, number>()
  contratos.forEach(c => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    if (fat) {
      pagamentoPorCliente.set(c.clienteId, getStatusFaturamento(fat))
      valorPorCliente.set(c.clienteId, fat.valor_total)
    }
  })

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main className="min-h-screen bg-[#07090D] pb-36">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-[#07090D]/95 backdrop-blur-sm px-5 pt-10 pb-3 border-b border-[#23272F]">
        <div className="flex items-baseline justify-between">
          <h1 className="text-white text-lg font-bold tracking-tight">Planejamento</h1>
          <Link href="/dashboard" className="text-[11px] text-[#0466C8] font-semibold">
            ← Modo Caos
          </Link>
        </div>
        <p className="text-[#7D8597] text-xs capitalize mt-0.5">{hoje}</p>
      </header>

      {error && (
        <div className="mx-4 mt-4 bg-amber-950/40 border border-amber-700/50 rounded-xl px-4 py-3 text-amber-400 text-sm">
          <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Aviso</p>
          {error}
        </div>
      )}

      <div className="px-4 pt-5 space-y-6">

        {/* MÉTRICAS RÁPIDAS */}
        <section>
          <SectionHeader label="Visão geral" />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Atrasados"
              value={urgentes.length}
              accent={urgentes.length > 0 ? 'red' : 'green'}
            />
            <MetricCard
              label="Atenção"
              value={atencao.length}
              accent={atencao.length > 0 ? 'amber' : 'green'}
            />
            <MetricCard
              label="A receber"
              value={formatValor(totalPendente)}
              sub={`de ${formatValor(totalMes)} no mês`}
              accent="amber"
            />
            <MetricCard
              label="Clientes ativos"
              value={clientesAtivos}
              accent="blue"
            />
          </div>
        </section>

        {/* VISITAS DO DIA */}
        {visitas.length > 0 && (
          <section>
            <SectionHeader label="Agenda de hoje" sub={`${visitas.length} visita${visitas.length > 1 ? 's' : ''}`} />
            <div className="space-y-3">
              {visitas.map(v => {
                const contrato = contratos.find(c => c.id === v.contratoId)
                const clienteId = contrato ? contrato.clienteId : ''
                const nome = clienteId ? (clienteNomePorId.get(clienteId) ?? clienteId) : 'Desconhecido'
                return (
                  <VisitaAgendaCard
                    key={v.id}
                    v={v}
                    clienteNome={nome}
                    pendenciasAbertas={pendenciasPorCliente.get(clienteId) ?? []}
                    statusPagamento={pagamentoPorCliente.get(clienteId)}
                    valorMes={valorPorCliente.get(clienteId)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* PENDÊNCIAS URGENTES */}
        {urgentes.length > 0 && (
          <section>
            <SectionHeader label="Atrasados" sub={`${urgentes.length}`} />
            <div className="space-y-2">
              {urgentes.map(p => (
                <PriorityCard 
                  key={p.id} 
                  p={p} 
                  clienteNome={clienteNomePorId.get(getClienteId(p)) || getClienteId(p)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* ATENÇÃO */}
        {atencao.length > 0 && (
          <section>
            <SectionHeader label="Vencem em breve" sub={`${atencao.length}`} />
            <div className="space-y-2">
              {atencao.map(p => (
                <PriorityCard 
                  key={p.id} 
                  p={p} 
                  clienteNome={clienteNomePorId.get(getClienteId(p)) || getClienteId(p)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* NORMAIS — visíveis mas não dominam */}
        {normais.length > 0 && (
          <section>
            <SectionHeader label="Demais pendências" sub={`${normais.length}`} />
            <div className="space-y-2">
              {normais.map(p => (
                <PriorityCard 
                  key={p.id} 
                  p={p} 
                  clienteNome={clienteNomePorId.get(getClienteId(p)) || getClienteId(p)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* TUDO EM DIA */}
        {abertas.length === 0 && visitas.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-5xl">✅</p>
            <p className="text-white font-semibold mt-4">Tudo em dia</p>
            <p className="text-[#7D8597] text-sm mt-1">Sem pendências ou visitas hoje.</p>
          </div>
        )}

      </div>

      {/* FABs */}
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
