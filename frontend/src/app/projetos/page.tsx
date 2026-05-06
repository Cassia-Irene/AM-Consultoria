'use client'
// app/projetos/page.tsx
//
// Listagem de projetos vinculados a contratos.
// Padrão visual Dark/Glass alinhado ao Dashboard.

import { useState, useEffect } from 'react'
import { getProjetos } from '@/mappers/projeto.mapper'
import { fetchApi } from '@/services/api'
import type { Projeto, StatusProjeto } from '@/domain/projeto'

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const data = await fetchApi<Projeto[]>('/projetos', undefined, getProjetos())
        if (isMounted) setProjetos(data)
      } catch (err) {
        if (isMounted) {
          console.warn('[WARN][PROJETOS] Erro ao carregar dados:', err)
          setError('Não foi possível carregar os projetos.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorBanner message={error} />

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      {/* ── HEADER ── */}
      <header className="px-5 pt-12 pb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">
          AM Consultoria
        </p>
        <h1 className="text-white text-3xl font-black tracking-tight">Projetos</h1>
        <p className="text-zinc-500 text-sm mt-1">Entregas e iniciativas vinculadas a contratos</p>

        <div className="mt-6 flex items-center gap-3">
          <StatPill label="Total" value={projetos.length} />
          <StatPill label="Em andamento" value={projetos.filter(p => p.status === 'em_andamento').length} color="sky" />
          <StatPill label="Concluídos" value={projetos.filter(p => p.status === 'concluido').length} color="emerald" />
        </div>
      </header>

      {/* ── LISTA ── */}
      <section className="px-5 space-y-4">
        {projetos.length === 0 ? (
          <EmptyState />
        ) : (
          projetos.map(p => <ProjetoCard key={p.id} projeto={p} />)
        )}
      </section>
    </main>
  )
}

/* ── COMPONENTES ── */

function ProjetoCard({ projeto: p }: { projeto: Projeto }) {
  const pctConcluido = calcPct(p)

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 hover:border-zinc-700 transition-colors group">
      {/* Linha 1: título + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-white font-bold text-base leading-tight">{p.titulo}</h2>
        <StatusBadge status={p.status} />
      </div>

      {/* Linha 2: descrição */}
      {p.descricao && (
        <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {p.descricao}
        </p>
      )}

      {/* Barra de progresso (apenas se em andamento) */}
      {p.status === 'em_andamento' && pctConcluido !== null && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Progresso (estimado)</span>
            <span className="text-[10px] font-bold text-sky-400">{pctConcluido}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{ width: `${pctConcluido}%` }}
            />
          </div>
        </div>
      )}

      {/* Linha 3: grid de metadados */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/50">
        <MetaItem label="Valor Total" value={`R$ ${p.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <MetaItem label="Contrato" value={`#${p.contratoId}`} />
        <MetaItem label="Início" value={new Date(p.data_inicio).toLocaleDateString('pt-BR')} />
        <MetaItem
          label={p.data_fim_real ? 'Concluído em' : 'Previsão de fim'}
          value={
            p.data_fim_real
              ? new Date(p.data_fim_real).toLocaleDateString('pt-BR')
              : p.data_fim_prevista
                ? new Date(p.data_fim_prevista).toLocaleDateString('pt-BR')
                : 'Não definida'
          }
        />
      </div>

      {/* Observações */}
      {p.observacoes_gerais && (
        <div className="mt-4 bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Observações</p>
          <p className="text-zinc-500 text-xs italic">&quot;{p.observacoes_gerais}&quot;</p>
        </div>
      )}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
      <p className="text-zinc-300 text-sm font-bold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: StatusProjeto }) {
  const config: Record<StatusProjeto, { label: string; className: string }> = {
    planejado:    { label: 'Planejado',    className: 'bg-zinc-800 text-zinc-400 border-zinc-700/30' },
    em_andamento: { label: 'Em andamento', className: 'bg-sky-900/40 text-sky-400 border-sky-800/30' },
    concluido:    { label: 'Concluído',    className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/30' },
    cancelado:    { label: 'Cancelado',    className: 'bg-red-900/40 text-red-400 border-red-800/30' },
  }
  const { label, className } = config[status]
  return (
    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${className}`}>
      {label}
    </span>
  )
}

function StatPill({ label, value, color = 'default' }: { label: string; value: number; color?: 'sky' | 'emerald' | 'default' }) {
  const textColor = color === 'sky' ? 'text-sky-400' : color === 'emerald' ? 'text-emerald-400' : 'text-white'
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-2 text-center">
      <p className={`text-lg font-black tabular-nums ${textColor}`}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-0.5">{label}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#07090D] px-5 pt-12">
      <div className="h-8 w-36 bg-zinc-900 rounded-xl animate-pulse mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-52 bg-zinc-900/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    </main>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#07090D] flex items-center justify-center px-5">
      <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-8 text-center max-w-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="text-white font-bold mb-1">Erro ao carregar</p>
        <p className="text-zinc-500 text-sm">{message}</p>
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="text-zinc-600 text-sm font-medium">Nenhum projeto encontrado.</p>
    </div>
  )
}

/** Calcula progresso estimado com base nas datas */
function calcPct(p: Projeto): number | null {
  if (!p.data_fim_prevista) return null
  const inicio = new Date(p.data_inicio).getTime()
  const fim = new Date(p.data_fim_prevista).getTime()
  const hoje = Date.now()
  if (fim <= inicio) return null
  const pct = Math.round(((hoje - inicio) / (fim - inicio)) * 100)
  return Math.min(Math.max(pct, 0), 100)
}
