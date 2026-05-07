'use client'
// app/pendencias/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PendenciasService } from '@/services/pendencias.service'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { getPendenciaSeveridade, getPendenciaStatus } from '@/utils/pendencia'
import type { Pendencia } from '@/domain/pendencia'
import { displayDate } from '@/utils/date'

type Filtro = 'todas' | 'abertas' | 'atrasadas' | 'concluidas'

type PendenciaView = {
  p: Pendencia
  clienteNome: string
  status: 'concluida' | 'aberta' | 'atrasada'
  severidade: 'urgente' | 'atencao' | 'normal'
}

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'abertas', label: 'Abertas' },
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: 'concluidas', label: 'Concluídas' },
]

export default function PendenciasPage() {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [pendencias, setPendencias] = useState<PendenciaView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [allPend, allCli, allCont] = await Promise.all([
          PendenciasService.getAll(),
          ClientesService.getAll(),
          ContratoService.getAll()
        ])

        if (!isMounted) return

        const cliMap = new Map(allCli.map(c => [c.id, c.nome_instituicao]))
        const contToCli = new Map(allCont.map(c => [c.id, c.clienteId]))

        const views: PendenciaView[] = allPend.map(p => {
          const cliId = contToCli.get(p.contratoId)
          const cliNome = cliId ? (cliMap.get(cliId) || `Cliente ${cliId}`) : 'Desconhecido'
          
          return {
            p,
            clienteNome: cliNome,
            status: getPendenciaStatus(p),
            severidade: getPendenciaSeveridade(p)
          }
        })

        setPendencias(views)
      } catch {
        if (isMounted) setError('Erro ao carregar pendências.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorBanner message={error} />

  // KPIs
  const kpiAbertas = pendencias.filter(v => v.status === 'aberta').length
  const kpiAtrasadas = pendencias.filter(v => v.status === 'atrasada').length
  const kpiConcluidas = pendencias.filter(v => v.status === 'concluida').length
  const kpiUrgentes = pendencias.filter(v => v.severidade === 'urgente' && v.status !== 'concluida').length

  // Filtragem
  const filtradas = pendencias.filter(v => {
    if (filtro === 'todas') return true
    if (filtro === 'abertas') return v.status === 'aberta'
    if (filtro === 'atrasadas') return v.status === 'atrasada'
    if (filtro === 'concluidas') return v.status === 'concluida'
    return true
  })

  // Agrupamento Visual
  const atrasadas = filtradas.filter(v => v.status === 'atrasada')
  const proximas = filtradas.filter(v => v.status === 'aberta')
  const resolvidas = filtradas.filter(v => v.status === 'concluida')

  // Helpers de Badge
  const badgeStatus = {
    concluida: 'bg-green-500/20 text-green-400',
    aberta: 'bg-blue-500/20 text-blue-400',
    atrasada: 'bg-red-500/20 text-red-400',
  }
  const badgeStatusLabel = { concluida: 'Concluída', aberta: 'Aberta', atrasada: 'Atrasada' }

  const badgeSeveridade = {
    urgente: 'bg-red-500/20 text-red-400',
    atencao: 'bg-yellow-500/20 text-yellow-400',
    normal: 'bg-zinc-700 text-zinc-300',
  }
  const badgeSeveridadeLabel = { urgente: 'Urgente', atencao: 'Atenção', normal: 'Normal' }

  const renderCard = (view: PendenciaView) => (
    <div key={view.p.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white text-base font-medium mb-1 wrap-break-word">{view.p.descricao}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{view.clienteNome}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 text-xs">Resp: {view.p.responsavel}</span>
            {view.p.data_prazo && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 text-xs">Prazo: {displayDate(view.p.data_prazo)}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${badgeSeveridade[view.severidade]}`}>
            {badgeSeveridadeLabel[view.severidade]}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${badgeStatus[view.status]}`}>
            {badgeStatusLabel[view.status]}
          </span>
        </div>
      </div>
    </div>
  )

  const renderGrupo = (titulo: string, items: PendenciaView[], emptyText?: string) => {
    if (items.length === 0) {
      if (emptyText) {
        return (
          <div className="mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">{titulo}</h2>
            <div className="text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl p-8 text-center bg-zinc-900/30">
              {emptyText}
            </div>
          </div>
        )
      }
      return null
    }

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">{titulo}</h2>
          <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {items.length}
          </span>
        </div>
        <div className="space-y-4">
          {items.map(renderCard)}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-24 text-white">
      {/* ── HEADER SUPERIOR ── */}
      <div className="sticky top-0 z-10 bg-[#07090D]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pendências</h1>
            <p className="text-sm text-zinc-400 mt-1">Acompanhamento operacional e itens críticos</p>
          </div>
          <Link href="/pendencias/nova" className="w-full sm:w-auto text-center inline-block bg-white text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors">
            + Nova Pendência
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {/* ── KPIs SUPERIORES ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Abertas</p>
            <p className="text-3xl font-black tabular-nums text-white">{kpiAbertas}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Atrasadas</p>
            <p className="text-3xl font-black tabular-nums text-red-400">{kpiAtrasadas}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Concluídas</p>
            <p className="text-3xl font-black tabular-nums text-green-400">{kpiConcluidas}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Urgentes</p>
            <p className="text-3xl font-black tabular-nums text-red-500">{kpiUrgentes}</p>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {FILTROS.map(f => {
            const isActive = filtro === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`
                  shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors border
                  ${isActive 
                    ? 'bg-zinc-800 text-white border-zinc-700' 
                    : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800/80'
                  }
                `}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* ── LISTAGEM PRINCIPAL ── */}
        {filtradas.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4 opacity-50">📋</p>
            <p className="text-zinc-400 text-sm font-medium">Nenhuma pendência encontrada</p>
          </div>
        ) : (
          <div>
            {renderGrupo('Atrasadas', atrasadas)}
            {renderGrupo('Próximas do Prazo', proximas)}
            {renderGrupo('Resolvidas', resolvidas)}
          </div>
        )}
      </div>
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#07090D] p-10 space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-zinc-900 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-2xl" />)}
      </div>
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-2xl" />)}
      </div>
    </main>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#07090D] flex items-center justify-center p-10">
      <div className="bg-red-950/20 border border-red-900/40 rounded-3xl p-10 text-center max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-white font-black text-xl mb-2">Erro</h2>
        <p className="text-zinc-500 text-sm mb-8">{message}</p>
        <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
          Voltar ao Dashboard
        </Link>
      </div>
    </main>
  )
}