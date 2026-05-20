'use client'
// app/pendencias/page.tsx

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PendenciasService } from '@/services/pendencias.service'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { getPendenciaSeveridade, getPendenciaStatus } from '@/utils/pendencia'
import type { Pendencia } from '@/domain/pendencia'
import { displayDate } from '@/utils/date'
import { OperationalTabs } from '@/components/OperationalTabs'
import { Plus } from 'lucide-react'

type Filtro = 'todas' | 'abertas' | 'atrasadas' | 'concluidas' | 'urgentes'

type PendenciaView = {
  p: Pendencia
  clienteNome: string
  status: 'concluida' | 'aberta' | 'atrasada'
  severidade: 'urgente' | 'atencao' | 'normal'
}

function PendenciasList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendencias, setPendencias] = useState<PendenciaView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Pendencia>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDate, setSearchDate] = useState('')

  const filtro = (searchParams.get('status') as Filtro) || 'todas'

  const setFiltro = (newStatus: Filtro) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus === 'todas') params.delete('status')
    else params.set('status', newStatus)
    router.replace(`/pendencias?${params.toString()}`)
  }

  const loadData = useCallback(async () => {
    try {
      const [allPend, allCli, allCont] = await Promise.all([
        PendenciasService.getAll(),
        ClientesService.getAll(),
        ContratoService.getAll()
      ])

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
      setError('Erro ao carregar pendências.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  // Lógica de destaque vindo do Dashboard
  useEffect(() => {
    const targetId = searchParams.get('id')
    if (targetId && pendencias.length > 0) {
      const found = pendencias.find(v => String(v.p.id) === targetId)
      if (found) {
        // Rolar até o item
        const el = document.getElementById(`pendencia-${targetId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        // Se for uma pendência urgente, podemos até abrir para edição automática
        // startEdit(found.p) 
      }
    }
  }, [searchParams, pendencias])


  async function handleResolve(id: string) {
    try {
      await PendenciasService.atualizar(id, { resolvida: true })
      loadData()
    } catch {
      alert('Erro ao resolver pendência')
    }
  }

  async function handleUnresolve(id: string) {
    try {
      await PendenciasService.atualizar(id, { resolvida: false })
      loadData()
    } catch {
      alert('Erro ao reabrir pendência')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir permanentemente esta pendência?')) return
    try {
      await PendenciasService.excluir(id)
      loadData()
    } catch {
      alert('Erro ao excluir pendência')
    }
  }



  function startEdit(p: Pendencia) {
    setEditingId(p.id)
    setEditForm(p)
  }

  async function handleSaveEdit() {
    if (!editingId) return
    try {
      await PendenciasService.atualizar(editingId, {
        descricao: editForm.descricao,
        responsavel: editForm.responsavel,
        data_prazo: editForm.data_prazo
      })
      setEditingId(null)
      loadData()
    } catch {
      alert('Erro ao salvar alterações')
    }
  }

  if (loading && pendencias.length === 0) return <LoadingSkeleton />
  if (error) return <ErrorBanner message={error} />

  // KPIs
  const kpiAbertas = pendencias.filter(v => v.status === 'aberta').length
  const kpiAtrasadas = pendencias.filter(v => v.status === 'atrasada').length
  const kpiConcluidas = pendencias.filter(v => v.status === 'concluida').length
  const kpiUrgentes = pendencias.filter(v => v.severidade === 'urgente' && v.status !== 'concluida').length

  // Filtragem
  const filtradas = pendencias.filter(v => {
    // 1. Filtro de Status/Filtro Principal
    let matchesStatus = true
    if (filtro === 'abertas') matchesStatus = v.status === 'aberta'
    else if (filtro === 'atrasadas') matchesStatus = v.status === 'atrasada'
    else if (filtro === 'concluidas') matchesStatus = v.status === 'concluida'
    else if (filtro === 'urgentes') matchesStatus = v.severidade === 'urgente' && v.status !== 'concluida'

    if (!matchesStatus) return false

    // 2. Filtro de Texto (searchTerm)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchesText = 
        v.p.descricao.toLowerCase().includes(term) ||
        v.clienteNome.toLowerCase().includes(term) ||
        (v.p.responsavel || '').toLowerCase().includes(term)
      if (!matchesText) return false
    }

    // 3. Filtro de Data (searchDate)
    if (searchDate) {
      if (!v.p.data_prazo) return false
      const prazoDate = v.p.data_prazo.split('T')[0]
      if (prazoDate !== searchDate) return false
    }

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


  const renderCard = (view: PendenciaView) => {
    const highlightParam = searchParams.get('highlight') || 'red'
    const isTarget = searchParams.get('id') === String(view.p.id)
    
    const highlightColors = {
      red: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
      amber: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      zinc: 'border-zinc-500 shadow-[0_0_15px_rgba(113,113,122,0.3)]',
      blue: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
    }
    
    const highlightClass = isTarget 
      ? `${highlightColors[highlightParam as keyof typeof highlightColors] || highlightColors.red} animate-pulse scale-[1.01]` 
      : 'border-zinc-800'
      
    const isEditing = editingId === view.p.id

    if (isEditing) {
      return (
        <div key={view.p.id} id={`pendencia-${view.p.id}`} className="rounded-2xl border border-blue-500 bg-zinc-900 p-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block mb-1">Descrição</label>
            <textarea
              className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-3 border border-zinc-700 focus:outline-none focus:border-blue-500"
              value={editForm.descricao}
              onChange={e => setEditForm({ ...editForm, descricao: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Responsável</label>
              <select
                className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-2.5 border border-zinc-700 focus:outline-none focus:border-blue-500"
                value={editForm.responsavel}
                onChange={e => setEditForm({ ...editForm, responsavel: e.target.value })}
              >
                <option value="Equipe Cliente">Equipe Cliente</option>
                <option value="AM Consultoria">AM Consultoria</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Prazo</label>
              <input
                type="date"
                className="w-full bg-zinc-800 text-white text-sm rounded-xl px-4 py-2.5 border border-zinc-700 focus:outline-none focus:border-blue-500"
                value={editForm.data_prazo ? editForm.data_prazo.split('T')[0] : ''}

                onChange={e => setEditForm({ ...editForm, data_prazo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setEditingId(null)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )
    }

    return (
      <div key={view.p.id} id={`pendencia-${view.p.id}`} className={`relative rounded-2xl border ${highlightClass} bg-zinc-900/60 p-4 hover:border-zinc-700 transition-all group`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white text-base font-medium mb-1 wrap-break-word">{view.p.descricao}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{view.clienteNome}</span>
              <span className="text-zinc-200">•</span>
              <span className="text-zinc-300 text-xs">Resp: {view.p.responsavel}</span>
              {view.p.data_prazo && (
                <>
                  <span className="text-zinc-200">•</span>
                  <span className="text-zinc-300 text-xs">Prazo: {displayDate(view.p.data_prazo)}</span>
                </>
              )}
              {view.p.visitaId && (
                <>
                  <span className="text-zinc-200">•</span>
                  <Link 
                    href={`/visitas/${view.p.visitaId}`}
                    className="text-sky-400 hover:text-sky-300 font-bold hover:underline transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    Origem: Visita #{view.p.visitaId}
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${badgeSeveridade[view.severidade]}`}>
                {badgeSeveridadeLabel[view.severidade]}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${badgeStatus[view.status]}`}>
                {badgeStatusLabel[view.status]}
              </span>
            </div>

            {view.status !== 'concluida' ? (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(view.p)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  title="Editar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleResolve(view.p.id)}
                  className="p-2 rounded-xl bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800 transition-all"
                  title="Marcar como resolvida"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(view.p.id)}
                  className="p-2 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-800 transition-all"
                  title="Excluir permanentemente"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleUnresolve(view.p.id)}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                  title="Reabrir pendência"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(view.p.id)}
                  className="p-2 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-800 transition-all"
                  title="Excluir permanentemente"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            )}


          </div>
        </div>
      </div>
    )
  }


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
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-200">{titulo}</h2>
          <span className="bg-zinc-800 text-zinc-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
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
            <p className="text-sm text-zinc-300 mt-1">Acompanhamento operacional e itens críticos</p>
          </div>
          <Link href="/pendencias/nova" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors">
            <Plus size={18} strokeWidth={3} /> Nova Pendência
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {/* ── KPIs SUPERIORES ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Abertas</p>
            <p className="text-3xl font-black tabular-nums text-white">{kpiAbertas}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Atrasadas</p>
            <p className="text-3xl font-black tabular-nums text-red-400">{kpiAtrasadas}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Concluídas</p>
            <p className="text-3xl font-black tabular-nums text-green-400">{kpiConcluidas}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">Urgentes</p>
            <p className="text-3xl font-black tabular-nums text-red-500">{kpiUrgentes}</p>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <OperationalTabs
          options={[
            { value: 'todas', label: 'Todas', count: pendencias.length },
            { value: 'abertas', label: 'Abertas', count: kpiAbertas },
            { value: 'urgentes', label: 'Urgentes', count: kpiUrgentes },
            { value: 'atrasadas', label: 'Atrasadas', count: kpiAtrasadas },
            { value: 'concluidas', label: 'Concluídas', count: kpiConcluidas },
          ]}
          currentValue={filtro}
          onChange={setFiltro}
        />

        {/* ── BARRA DE BUSCA E DATA ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 mt-6">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Buscar por descrição, cliente ou responsável..."
              className="w-full bg-zinc-900/60 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 transition-colors placeholder-zinc-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3.5 top-3.5 text-zinc-300">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
          <div>
            <input
              type="date"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 transition-colors text-zinc-300"
              value={searchDate}
              onChange={e => setSearchDate(e.target.value)}
              title="Filtrar por data limite (prazo)"
            />
          </div>
        </div>

        {(searchTerm || searchDate) && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                setSearchTerm('')
                setSearchDate('')
              }}
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-1.5 transition-colors font-semibold"
            >
              Limpar filtros de busca
            </button>
          </div>
        )}

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

export default function PendenciasPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PendenciasList />
    </Suspense>
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