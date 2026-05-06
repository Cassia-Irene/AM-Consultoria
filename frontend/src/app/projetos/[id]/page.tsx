'use client'
// src/app/projetos/[id]/page.tsx
//
// Detalhe do projeto com visão operacional (entregas) e financeira (parcelas).

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { getProjetos } from '@/mappers/projeto.mapper'
import { getEntregas } from '@/mappers/entrega.mapper'
import { getProjetoParcelas } from '@/mappers/projetoParcela.mapper'
import { getProjetoExtras } from '@/mappers/projetoExtra.mapper'
import { fetchApi } from '@/services/api'
import { formatCurrency } from '@/utils/finance'
import type { Projeto } from '@/domain/projeto'
import type { Entrega } from '@/domain/entrega'
import type { ProjetoParcela } from '@/domain/projetoParcela'
import type { ProjetoExtra } from '@/domain/projetoExtra'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjetoDetalhePage({ params }: PageProps) {
  const { id } = use(params)
  
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [parcelas, setParcelas] = useState<ProjetoParcela[]>([])
  const [extras, setExtras] = useState<ProjetoExtra[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [projects, allEntregas, allParcelas, allExtras] = await Promise.all([
          fetchApi<Projeto[]>('/projetos', undefined, getProjetos()),
          fetchApi<Entrega[]>('/entregas', undefined, getEntregas()),
          fetchApi<ProjetoParcela[]>('/projeto-parcelas', undefined, getProjetoParcelas()),
          fetchApi<ProjetoExtra[]>('/projeto-extras', undefined, getProjetoExtras())
        ])

        if (!isMounted) return

        const found = projects.find(p => p.id === id)
        if (!found) {
          setError('Projeto não encontrado.')
          return
        }

        setProjeto(found)
        setEntregas(allEntregas.filter(e => e.projetoId === id))
        setParcelas(allParcelas.filter(p => p.projetoId === id))
        setExtras(allExtras.filter(ex => ex.projetoId === id))
      } catch (err) {
        if (isMounted) {
          console.error('[ERROR][PROJETO_DETAIL]', err)
          setError('Erro ao carregar detalhes do projeto.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [id])

  if (loading) return <LoadingSkeleton />
  if (error || !projeto) return <ErrorState message={error || 'Projeto inexistente'} />

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      {/* ── HEADER ── */}
      <header className="px-5 pt-12 pb-8">
        <Link 
          href="/projetos" 
          className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-sky-500 transition-colors mb-4 inline-block"
        >
          ← Voltar para projetos
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-3xl font-black tracking-tight">{projeto.titulo}</h1>
            <p className="text-zinc-500 text-sm mt-1">ID: #{projeto.id} · Contrato: #{projeto.contratoId}</p>
          </div>
          <StatusBadge status={projeto.status} />
        </div>

        {/* Card Principal */}
        <div className="mt-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 shadow-xl shadow-black/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetaItem label="Valor Total" value={formatCurrency(projeto.valor_total)} highlight />
            <MetaItem label="Data Início" value={new Date(projeto.data_inicio).toLocaleDateString('pt-BR')} />
            <MetaItem 
              label="Previsão Fim" 
              value={projeto.data_fim_prevista ? new Date(projeto.data_fim_prevista).toLocaleDateString('pt-BR') : '—'} 
            />
            <MetaItem 
              label="Conclusão Real" 
              value={projeto.data_fim_real ? new Date(projeto.data_fim_real).toLocaleDateString('pt-BR') : 'Em aberto'} 
              color={projeto.data_fim_real ? 'emerald' : 'zinc'}
            />
          </div>
          {projeto.descricao && (
            <div className="mt-6 pt-6 border-t border-zinc-800/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Descrição</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{projeto.descricao}</p>
            </div>
          )}
        </div>
      </header>

      {/* ── CONTEÚDO (GRID) ── */}
      <div className="px-5 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Entregas (Timeline) */}
        <section className="space-y-6">
          <SectionHeader label="Cronograma de Entregas" />
          <div className="space-y-4">
            {entregas.length > 0 ? (
              entregas.map(e => (
                <div key={e.id} className="relative pl-6 border-l border-zinc-800 pb-2 last:pb-0">
                  <div className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-[#07090D] ${e.entregue ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">
                    {new Date(e.data_entrega_prevista).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">{e.descricao}</p>
                  <p className={`text-[10px] font-bold mt-1 ${e.entregue ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {e.entregue ? '✓ Entregue' : '○ Pendente'}
                  </p>
                </div>
              ))
            ) : (
              <EmptyBox message="Sem entregas cadastradas." />
            )}
          </div>
        </section>

        {/* Parcelas (Financeiro) */}
        <section className="space-y-6">
          <SectionHeader label="Controle de Parcelas" />
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
            {parcelas.length > 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {parcelas.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                    <div>
                      <p className="text-white text-sm font-bold">Parcela {p.numero_parcela}</p>
                      <p className="text-[10px] text-zinc-600 font-medium">Venc: {new Date(p.data_pagamento_prevista).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-200 font-black text-sm">{formatCurrency(p.valor_parcela)}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${p.pago ? 'text-emerald-500' : 'text-red-500'}`}>
                        {p.pago ? 'Pago' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyBox message="Sem parcelas registradas." />
            )}
          </div>
        </section>

        {/* Extras (Solicitações) */}
        <section className="space-y-6">
          <SectionHeader label="Solicitações Extras" />
          <div className="space-y-3">
            {extras.length > 0 ? (
              extras.map(ex => (
                <div key={ex.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Extra #{ex.id}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${ex.aprovado_por ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {ex.aprovado_por ? 'Aprovado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-400 text-xs">Solicitado por: <span className="text-zinc-200 font-bold">{ex.solicitado_por}</span></p>
                    {ex.aprovado_por && <p className="text-zinc-400 text-xs">Aprovado por: <span className="text-zinc-200 font-bold">{ex.aprovado_por}</span></p>}
                  </div>
                </div>
              ))
            ) : (
              <EmptyBox message="Sem extras registrados." />
            )}
          </div>
        </section>

      </div>
    </main>
  )
}

/* ── COMPONENTES INTERNOS ── */

function MetaItem({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className={`font-bold ${highlight ? 'text-white text-xl' : 'text-zinc-300 text-sm'} ${color === 'emerald' ? 'text-emerald-500' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 shrink-0">{label}</h2>
      <div className="h-px bg-zinc-800/50 flex-1" />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planejado: 'bg-zinc-800 text-zinc-400 border-zinc-700/30',
    em_andamento: 'bg-sky-900/40 text-sky-400 border-sky-800/30',
    concluido: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/30',
    cancelado: 'bg-red-900/40 text-red-400 border-red-800/30',
  }
  return (
    <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${colors[status] || colors.planejado}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="py-8 px-4 border border-zinc-800 border-dashed rounded-2xl text-center">
      <p className="text-zinc-600 text-xs italic">{message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090D] p-10 space-y-10 animate-pulse">
      <div className="h-10 w-64 bg-zinc-900 rounded-xl" />
      <div className="h-48 bg-zinc-900 rounded-2xl" />
      <div className="grid grid-cols-3 gap-8">
        <div className="h-64 bg-zinc-900/50 rounded-2xl" />
        <div className="h-64 bg-zinc-900/50 rounded-2xl" />
        <div className="h-64 bg-zinc-900/50 rounded-2xl" />
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center p-5">
      <p className="text-4xl mb-4">🌑</p>
      <h2 className="text-white font-black text-xl mb-2">Ops! Algo deu errado</h2>
      <p className="text-zinc-500 text-center max-w-xs mb-8">{message}</p>
      <Link href="/projetos" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
        Voltar para Projetos
      </Link>
    </div>
  )
}
