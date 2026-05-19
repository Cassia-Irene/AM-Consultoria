'use client'
// app/projetos/page.tsx
//
// Listagem de projetos vinculados a contratos.
// Padrão visual Dark/Glass alinhado ao Dashboard.

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProjetosService } from '@/services/projetos.service'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import Link from 'next/link'
import type { Projeto, StatusProjeto } from '@/domain/projeto'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import { OperationalTabs, type TabOption } from '@/components/OperationalTabs'
import { AlertTriangle, Plus } from 'lucide-react'
import { ProjectCreationDrawer } from '@/components/ProjectCreationDrawer'

type FiltroProjeto = 'todos' | StatusProjeto | 'atrasados' | 'extras'

function ProjetosList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

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
        const [projData, clientData, contractData] = await Promise.all([
          ProjetosService.getAll(),
          ClientesService.getAll().catch(() => []),
          ContratoService.getAll().catch(() => [])
        ])
        if (isMounted) {
          setProjetos(projData)
          setClientes(clientData)
          setContratos(contractData)
        }
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

  const contractsMap = useMemo(() => {
    const map = new Map<string, string>()
    contratos.forEach(c => {
      if (c.id && c.clienteId) {
        map.set(String(c.id), String(c.clienteId))
      }
    })
    return map
  }, [contratos])

  const clientsMap = useMemo(() => {
    const map = new Map<string, string>()
    clientes.forEach(c => {
      if (c.id && c.nome_instituicao) {
        map.set(String(c.id), c.nome_instituicao)
      }
    })
    return map
  }, [clientes])

  const getProjectClientName = useCallback((p: Projeto): string => {
    const clienteId = p.clienteId || contractsMap.get(p.contratoId)
    if (!clienteId) return 'Desconhecido'
    return clientsMap.get(clienteId) || 'Desconhecido'
  }, [contractsMap, clientsMap])

  const filteredItems = useMemo(() => {
    let items = projetos
    if (filtro === 'atrasados') {
      items = projetos.filter(p => (p.count_atrasos ?? 0) > 0 || p.nivel_tensao === 'crítico')
    } else if (filtro === 'extras') {
      items = projetos.filter(p => p.isExtra)
    } else if (filtro !== 'todos') {
      const normalize = (s: string) => s.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
      const normFiltro = normalize(filtro)
      items = projetos.filter(p => normalize(p.status) === normFiltro)
    }

    if (selectedClient) {
      items = items.filter(p => {
        const pClienteId = p.clienteId || contractsMap.get(p.contratoId)
        return pClienteId === selectedClient
      })
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      items = items.filter(p => {
        const titleMatch = p.titulo.toLowerCase().includes(term)
        const descMatch = p.descricao ? p.descricao.toLowerCase().includes(term) : false
        const contractMatch = p.contratoId.toLowerCase().includes(term)
        const clientNameMatch = getProjectClientName(p).toLowerCase().includes(term)
        return titleMatch || descMatch || contractMatch || clientNameMatch
      })
    }

    return items
  }, [projetos, filtro, selectedClient, searchTerm, contractsMap, getProjectClientName])

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
      {/* ── HEADER ── */}
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-white text-3xl font-black tracking-tight">Projetos</h1>

          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-lg shadow-sky-900/20"
          >
            <Plus className="w-5 h-5 color-white" />
            Novo Projeto
          </button>
        </div>

        <p className="text-zinc-400 text-sm mt-4">Entregas e iniciativas vinculadas a contratos</p>
      </header>

      <div className="px-5 mb-4">
        <OperationalTabs 
          options={tabOptions} 
          currentValue={filtro} 
          onChange={setFiltro} 
        />
      </div>

      {/* ── BARRA DE BUSCA E FILTRO DE CLIENTE ── */}
      <div className="px-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            placeholder="Buscar por título, descrição ou contrato..."
            className="w-full bg-zinc-900/60 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 transition-colors placeholder-zinc-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3.5 top-3.5 text-zinc-400">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
        <div>
          <select
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 transition-colors text-zinc-300 cursor-pointer"
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            title="Filtrar por Cliente"
          >
            <option value="">Todos os Clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id} className="bg-[#07090D] text-white">
                {c.nome_instituicao}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(searchTerm || selectedClient) && (
        <div className="px-5 mb-6 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedClient('')
            }}
            className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-1.5 transition-colors font-semibold"
          >
            Limpar filtros de busca
          </button>
        </div>
      )}

      <section className="px-5 space-y-4">
        {filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          filteredItems.map(p => (
            <Link key={p.id} href={`/projetos/${p.id}`} className="block">
              <ProjetoCard projeto={p} clientName={getProjectClientName(p)} />
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

function ProjetoCard({ projeto: p, clientName }: { projeto: Projeto; clientName: string }) {
  const cleanEvidence = (ev: string, mainText: string): string => {
    if (!mainText) return ev
    const parts = ev.split(/\s*[·•|]\s*|\s+-\s+/)
    
    const normalizeText = (text: string) => 
      text.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')

    const normMain = normalizeText(mainText)
    
    const remainingParts = parts
      .map(p => p.trim())
      .filter(p => {
        if (!p) return false
        const normPart = normalizeText(p)
        return !normMain.includes(normPart) && !normPart.includes(normMain)
      })
      
    return remainingParts.join(' · ')
  }

  const mainText = p.motivo_auditavel_resumido || p.observacoes_gerais || ''
  const cleanedEvidencias = p.evidencias_resumidas
    ? p.evidencias_resumidas
        .map(ev => cleanEvidence(ev, mainText))
        .filter(ev => ev.trim().length > 0)
    : []

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 hover:border-zinc-700 transition-colors group">
      {/* Linha 1: título + badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-white font-bold text-base leading-tight">{p.titulo}</h2>
          {p.nivel_tensao === 'crítico' && (
            <div className="mt-4 flex items-center gap-1.5 text-red-500">
              <AlertTriangle size={12} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase">
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
        <p className="text-white/80 text-sm leading-relaxed mb-4 line-clamp-2">
          {p.descricao}
        </p>
      )}

      {/* Avanço Factual (Progresso Determinístico) */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Avanço Factual</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-zinc-800/50">
        <MetaItem label="Cliente" value={clientName} />
        <MetaItem label="Contrato" value={`#${p.contratoId}`} />
        <MetaItem label="Valor Total" value={`R$ ${p.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
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
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-200 mb-1">
            {p.override_ativo ? 'Governança Humana' : 'Leitura Operacional'}
          </p>
          <p className="text-sky-500 text-xs md:text-sm font-medium italic leading-relaxed">
            &quot;{p.motivo_auditavel_resumido || p.observacoes_gerais}&quot;
          </p>
          {cleanedEvidencias.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {cleanedEvidencias.map((ev, i) => (
                <span key={i} className="text-[8px] md:text-[10px] font-bold text-zinc-300 uppercase">
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
      <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 mb-0.5">{label}</p>
      <p className="text-zinc-200 text-sm font-bold">{value}</p>
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
      <p className="text-zinc-300 text-sm font-medium">Nenhum projeto encontrado.</p>
    </div>
  )
}
