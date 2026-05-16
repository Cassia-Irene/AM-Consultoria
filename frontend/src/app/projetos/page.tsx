'use client'
// app/projetos/page.tsx
//
// Listagem de projetos vinculados a contratos.
// Padrão visual Dark/Glass alinhado ao Dashboard.

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProjetosService } from '@/services/projetos.service'
import Link from 'next/link'
import type { Projeto, StatusProjeto } from '@/domain/projeto'
import { OperationalTabs, type TabOption } from '@/components/OperationalTabs'
import { AlertTriangle, Plus } from 'lucide-react'
import { ProjectCreationDrawer } from '@/components/ProjectCreationDrawer'

type FiltroProjeto = 'todos' | StatusProjeto | 'atrasados' | 'extras'

function ProjetosList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const filtro = (searchParams.get('status') as FiltroProjeto) || 'todos'

  const setFiltro = (newStatus: FiltroProjeto) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus === 'todos') params.delete('status')
    else params.set('status', newStatus)
    router.replace(`/projetos?${params.toString()}`)
  }

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const data = await ProjetosService.getAll()
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

  const filteredItems = useMemo(() => {
    if (filtro === 'todos') return projetos
    if (filtro === 'atrasados') return projetos.filter(p => (p.count_atrasos ?? 0) > 0 || p.nivel_tensao === 'crítico')
    if (filtro === 'extras') return projetos.filter(p => p.isExtra)
    
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')

    const normFiltro = normalize(filtro)
    return projetos.filter(p => normalize(p.status) === normFiltro)
  }, [projetos, filtro])

    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')

  const tabOptions: TabOption<FiltroProjeto>[] = [
    { value: 'todos', label: 'Todos', count: projetos.length },
    { value: 'atrasados', label: 'Críticos/Atrasados', count: projetos.filter(p => (p.count_atrasos ?? 0) > 0 || p.nivel_tensao === 'crítico').length },
    { value: 'extras', label: 'Extras', count: projetos.filter(p => p.isExtra).length },
    { value: 'em andamento', label: 'Em Andamento', count: projetos.filter(p => normalize(p.status) === 'em_andamento').length },
    { value: 'concluído', label: 'Concluídos', count: projetos.filter(p => normalize(p.status) === 'concluido').length },
  ]

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorBanner message={error} />

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
            AM Consultoria
          </p>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg shadow-sky-900/20"
          >
            <Plus size={14} />
            Novo Projeto
          </button>
        </div>
        <h1 className="text-white text-3xl font-black tracking-tight">Projetos</h1>
        <p className="text-zinc-500 text-sm mt-1">Entregas e iniciativas vinculadas a contratos</p>
      </header>

      <div className="px-5 mb-4">
        <OperationalTabs 
          options={tabOptions} 
          currentValue={filtro} 
          onChange={setFiltro} 
        />
      </div>

      <section className="px-5 space-y-4">
        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          filteredItems.map(p => (
            <Link key={p.id} href={`/projetos/${p.id}`} className="block">
              <ProjetoCard projeto={p} />
            </Link>
          ))
        )}
      </section>

      <ProjectCreationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={(id) => router.push(`/projetos/${id}`)}
      />
    </main>
  )
}

export default function ProjetosPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjetosList />
    </Suspense>
  )
}


/* ── COMPONENTES ── */

function ProjetoCard({ projeto: p }: { projeto: Projeto }) {

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 hover:border-zinc-700 transition-colors group">
      {/* Linha 1: título + badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-white font-bold text-base leading-tight">{p.titulo}</h2>
          {p.nivel_tensao === 'crítico' && (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertTriangle size={12} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-tighter">
                Operação Crítica
              </span>
            </div>
          )}
          {p.tendencia === 'subindo' && (
             <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">↑ Tensão em Elevação</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {p.isExtra && (
            <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border border-amber-500/20">
              Projeto Extra
            </span>
          )}
          <StatusBadge status={p.status} />
        </div>
      </div>

      {/* Linha 2: descrição */}
      {p.descricao && (
        <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {p.descricao}
        </p>
      )}

      {/* Avanço Factual (Progresso Determinístico) */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Avanço Factual</span>
          <span className="text-[10px] font-black text-white">
            {p.percentual_conclusao || 0}%
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all shadow-[0_0_8px_rgba(14,165,233,0.3)]"
            style={{ width: `${p.percentual_conclusao || 0}%` }}
          />
        </div>
      </div>


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

      {/* Explicabilidade Interpretativa (Substitui Observações Brutas) */}
      {(p.motivo_auditavel_resumido || p.observacoes_gerais) && (
        <div className="mt-4 bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">
            {p.override_ativo ? 'Governança Humana' : 'Leitura Operacional'}
          </p>
          <p className="text-zinc-400 text-xs font-medium italic leading-relaxed">
            &quot;{p.motivo_auditavel_resumido || p.observacoes_gerais}&quot;
          </p>
          {p.evidencias_resumidas && p.evidencias_resumidas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {p.evidencias_resumidas.map((ev, i) => (
                <span key={i} className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                  • {ev}
                </span>
              ))}
            </div>
          )}
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
  const config: Record<string, { label: string; className: string }> = {
    'em andamento': { label: 'Em andamento', className: 'bg-sky-900/40 text-sky-400 border-sky-800/30' },
    'em_andamento': { label: 'Em andamento', className: 'bg-sky-900/40 text-sky-400 border-sky-800/30' },
    'concluído':    { label: 'Concluído',    className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/30' },
    'concluido':    { label: 'Concluído',    className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/30' },
    cancelado:      { label: 'Cancelado',    className: 'bg-red-900/40 text-red-400 border-red-800/30' },
  }
  
  const current = config[status] || { label: status, className: 'bg-zinc-900 text-zinc-500 border-zinc-800' }
  
  return (
    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${current.className}`}>
      {current.label}
    </span>
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
