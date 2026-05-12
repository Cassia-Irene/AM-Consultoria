'use client'
// src/app/clientes/[id]/page.tsx
//
// Página de detalhes do cliente. Atua como um mini-CRM.
// Consolida contratos, contatos, faturamentos e projetos.

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { ContatosService } from '@/services/contatos.service'
import { FaturamentosService } from '@/services/faturamento.service'
import { ProjetosService } from '@/services/projetos.service'
import { formatCurrency } from '@/utils/finance'
import { getStatusFaturamento } from '@/domain/faturamento'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { ClientManager } from '@/components/ClientManager'
import { ContactManager } from '@/components/ContactManager'

import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { Contato } from '@/domain/contato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Projeto } from '@/domain/projeto'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClienteDetalhePage({ params }: PageProps) {
  const { id } = use(params)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [faturamentos, setFaturamentos] = useState<FaturamentoCliente[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false)
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 1. Busca o cliente primeiro para garantir existência
      const foundCliente = await ClientesService.getById(id)

      if (!foundCliente) {
        setError('Cliente não encontrado')
        setLoading(false)
        return
      }

      setCliente(foundCliente)

      // 2. Busca dados relacionados em paralelo usando os Services
      const [allContratos, allContatos, allFaturamentos, allProjetos] = await Promise.all([
        ContratoService.getByClienteId(id),
        ContatosService.getByClienteId(id),
        FaturamentosService.getAll(),
        ProjetosService.getAll()
      ])

      setContratos(allContratos)
      setContatos(allContatos.filter(c => c.status !== 'arquivado')) // Default: Esconder arquivados

      const contratoIds = allContratos.map(c => c.id)
      setFaturamentos(allFaturamentos.filter(f => contratoIds.includes(f.contratoId)))
      setProjetos(allProjetos.filter(p => contratoIds.includes(p.contratoId)))

    } catch (err) {
      console.error('[ERROR][CLIENTE_DETAIL]', err)
      setError('Erro ao carregar os dados do cliente.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    
    // Defer para evitar aviso de "setState síncrono" em cascata
    const timeout = setTimeout(() => {
      if (active) loadData()
    }, 0)

    return () => { 
      active = false
      clearTimeout(timeout)
    }
  }, [loadData])

  if (loading) return <LoadingSkeleton />
  if (error || !cliente) return <ErrorState message={error || 'Cliente não encontrado'} />

  // Cálculos para KPIs
  const contratosAtivos = contratos.filter(c => c.status === 'ativo')
  const receitaMensal = contratosAtivos.reduce((acc, c) => acc + (c.valor_mensal || 0), 0)
  const projetosAtivos = projetos.filter(p => p.status === 'em_andamento')

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      {/* ── HEADER DE NAVEGAÇÃO ── */}
      <div className="px-5 pt-12 pb-4">
        <Link 
          href="/clientes" 
          className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-sky-500 transition-colors inline-block mb-4"
        >
          ← Voltar para clientes
        </Link>
      </div>

      <div className="px-5 space-y-6">
        {/* ── HEADER PRINCIPAL (FOCO OPERACIONAL) ── */}
        <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/50 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-white text-4xl font-black tracking-tighter">{cliente.nome_instituicao}</h1>
                <ClienteStatusBadge status={cliente.status} />
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-zinc-500 text-sm font-medium mb-8">
                <span className="flex items-center gap-2">
                   <span className="size-1.5 rounded-full bg-zinc-700" />
                   {cliente.tipo_instituicao}
                </span>
                <span className="flex items-center gap-2">
                   <span className="size-1.5 rounded-full bg-zinc-700" />
                   {cliente.cidade}
                </span>
                {cliente.nivel_complexidade && (
                  <span className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-sky-500/50" />
                    Complexidade {cliente.nivel_complexidade}
                  </span>
                )}
              </div>

              {cliente.observacoes_gerais && (
                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Dinâmica Operacional</p>
                  <p className="text-zinc-300 text-sm leading-relaxed italic">
                    &quot;{cliente.observacoes_gerais}&quot;
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button 
                onClick={() => setIsClientDrawerOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-white/10 transition-all active:scale-[0.98]"
              >
                Editar Dados
              </button>
              <button 
                onClick={() => {
                  setSelectedContactId(undefined)
                  setIsContactDrawerOpen(true)
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-sky-900/20 active:scale-[0.98]"
              >
                + Adicionar Contato
              </button>
              <button 
                onClick={async () => {
                  if (confirm('Deseja realmente arquivar esta instituição?')) {
                    try {
                      await ClientesService.update(id, { ...cliente, status: 'inativo' })
                      window.location.href = '/clientes'
                    } catch {
                      alert('Erro ao arquivar cliente.')
                    }
                  }
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-red-500/20 transition-all active:scale-[0.98]"
              >
                Arquivar Instituição
              </button>
            </div>
          </div>
        </div>

        {/* ── KPIs SUPERIORES ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Contratos Ativos" value={contratosAtivos.length.toString()} />
          <KpiCard label="Receita Mensal (Ativa)" value={formatCurrency(receitaMensal)} color="emerald" />
          <KpiCard label="Projetos Ativos" value={projetosAtivos.length.toString()} color="sky" />
          <KpiCard label="Contatos Vinculados" value={contatos.length.toString()} />
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* COLUNA 1: Contratos */}
          <div className="space-y-4">
            <SectionHeader label="Contratos" />
            <div className="space-y-3">
              {contratos.length > 0 ? (
                contratos.map(c => (
                  <Link key={c.id} href={`/contratos/${c.id}`} className="block group">
                    <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 transition-colors group-hover:bg-zinc-800/40 group-hover:border-zinc-700">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">#{c.id}</span>
                        <ContratoStatusBadge status={c.status} />
                      </div>
                      <p className="text-white font-bold text-sm mb-1 line-clamp-1">{c.servicos_contratados}</p>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Valor Mensal</p>
                          <p className="text-zinc-200 font-bold">{formatCurrency(c.valor_mensal || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Visitas/mês</p>
                          <p className="text-zinc-400 font-medium text-sm">{c.visitas_previstas_mes}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyCard message="Nenhum contrato ativo" />
              )}
            </div>
          </div>

          {/* COLUNA 2: Contatos & Projetos */}
          <div className="space-y-6">
            <div>
              <SectionHeader label="Stakeholders & Contatos" />
              <div className="space-y-3 mt-4">
                {contatos.length > 0 ? (
                  contatos.sort((a, b) => (b.isPrincipal ? 1 : 0) - (a.isPrincipal ? 1 : 0)).map(contato => {
                    // Extrai tags das observações para exibição
                    const match = (contato.observacoes_gerais || '').match(/^\[(.*?)\]/)
                    const tags = match ? match[1].split(',').map(t => t.trim()) : []
                    const cleanObs = (contato.observacoes_gerais || '').replace(/^\[.*?\]\s*/, '')

                    return (
                      <div 
                        key={contato.id} 
                        onClick={() => {
                           setSelectedContactId(contato.id)
                           setIsContactDrawerOpen(true)
                        }}
                        className={`group border rounded-xl p-4 transition-all cursor-pointer ${
                          contato.isPrincipal 
                            ? 'bg-sky-500/5 border-sky-500/30 hover:border-sky-500/50' 
                            : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {contato.isPrincipal && (
                              <span className="text-sky-500" title="Contato Principal">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </span>
                            )}
                            <div>
                              <p className="text-white font-bold text-sm">{contato.nome}</p>
                              {contato.cargo && <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{contato.cargo}</p>}
                            </div>
                          </div>
                          <PapelBadge papel={contato.papel} />
                        </div>

                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          {contato.telefone_whatsapp && (
                            <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                              <span className="text-emerald-500 text-[10px] font-black uppercase">WA:</span> 
                              <span className="font-medium">{contato.telefone_whatsapp}</span>
                            </p>
                          )}
                          {contato.email && (
                            <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                              <span className="text-sky-500 text-[10px] font-black uppercase">@</span> 
                              <span className="font-medium truncate max-w-[150px]">{contato.email}</span>
                            </p>
                          )}
                        </div>

                        {cleanObs && (
                          <p className="mt-3 text-[11px] text-zinc-500 italic leading-relaxed border-t border-white/5 pt-3 line-clamp-1 group-hover:line-clamp-none transition-all">
                            &quot;{cleanObs}&quot;
                          </p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <EmptyCard message="Nenhum contato vinculado" />
                )}
              </div>
            </div>

            <div>
              <SectionHeader label="Projetos Recentes" />
              <div className="space-y-3 mt-4">
                {projetos.length > 0 ? (
                  projetos.slice(0, 5).map(p => (
                    <Link key={p.id} href={`/projetos/${p.id}`} className="block group">
                      <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 transition-colors group-hover:bg-zinc-800/40 group-hover:border-zinc-700">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-white font-bold text-sm line-clamp-1 pr-2">{p.titulo}</p>
                          <ProjetoStatusBadge status={p.status} />
                        </div>
                        <p className="text-zinc-400 text-xs mt-2">{formatCurrency(p.valor_total)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyCard message="Nenhum projeto vinculado" />
                )}
              </div>
            </div>
          </div>

          {/* COLUNA 3: Faturamento Histórico */}
          <div className="space-y-4">
            <SectionHeader label="Histórico de Faturamento" />
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
              {faturamentos.length > 0 ? (
                <div className="divide-y divide-zinc-800/50">
                  {faturamentos.sort((a, b) => b.mes_ano.localeCompare(a.mes_ano)).slice(0, 10).map(f => {
                    const status = getStatusFaturamento(f)
                    return (
                      <div key={f.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                        <div>
                          <p className="text-white text-sm font-bold">{formatMesAno(f.mes_ano)}</p>
                          <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest mt-0.5">Contrato #{f.contratoId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-zinc-200 font-black text-sm">{formatCurrency(f.valor_total)}</p>
                          <FaturamentoStatusText status={status} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4"><EmptyCard message="Sem histórico de faturamentos" /></div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── DRAWERS DE GESTÃO ── */}
      <OperationalDrawer
        isOpen={isClientDrawerOpen}
        onClose={() => setIsClientDrawerOpen(false)}
        title="Editar Instituição"
      >
        <ClientManager 
          id={id} 
          onClose={() => setIsClientDrawerOpen(false)} 
          onSuccess={loadData} 
        />
      </OperationalDrawer>

      <OperationalDrawer
        isOpen={isContactDrawerOpen}
        onClose={() => setIsContactDrawerOpen(false)}
        title={selectedContactId ? 'Editar Contato' : 'Novo Contato'}
      >
        <ContactManager 
          id={selectedContactId}
          clienteId={id}
          onClose={() => setIsContactDrawerOpen(false)}
          onSuccess={loadData}
        />
      </OperationalDrawer>
    </main>
  )
}

/* ── COMPONENTES INTERNOS & HELPERS ── */

function KpiCard({ label, value, color = 'default' }: { label: string; value: string; color?: 'sky' | 'emerald' | 'default' }) {
  const textColor = color === 'sky' ? 'text-sky-400' : color === 'emerald' ? 'text-emerald-400' : 'text-white'
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex flex-col justify-center">
      <p className={`text-2xl font-black tabular-nums tracking-tight ${textColor}`}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">{label}</p>
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

function ClienteStatusBadge({ status }: { status: string }) {
  const isAtivo = status === 'ativo'
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
      isAtivo ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
    }`}>
      {status}
    </span>
  )
}

function ContratoStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ativo: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    suspenso: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    inativo: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors[status] || colors.inativo}`}>
      {status}
    </span>
  )
}

function ProjetoStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planejado: 'text-zinc-400 bg-zinc-800 border-zinc-700/50',
    em_andamento: 'text-sky-400 bg-sky-900/30 border-sky-800/30',
    concluido: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/30',
    cancelado: 'text-red-400 bg-red-900/30 border-red-800/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors[status] || colors.planejado}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PapelBadge({ papel }: { papel: string }) {
  let colorClass = 'text-zinc-400 bg-zinc-800 border-zinc-700/50' // Operacional ou default
  const lowerPapel = papel.toLowerCase()
  if (lowerPapel.includes('decisor')) colorClass = 'text-sky-400 bg-sky-900/30 border-sky-800/30'
  else if (lowerPapel.includes('financeiro')) colorClass = 'text-emerald-400 bg-emerald-900/30 border-emerald-800/30'
  
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colorClass}`}>
      {papel}
    </span>
  )
}

function FaturamentoStatusText({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pago: 'text-emerald-500',
    pendente: 'text-amber-500',
    atrasado: 'text-red-500',
  }
  return (
    <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${colors[status] || colors.pendente}`}>
      {status}
    </p>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="py-6 px-4 border border-zinc-800 border-dashed rounded-xl text-center">
      <p className="text-zinc-600 text-xs italic">{message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090D] p-10 space-y-8 animate-pulse">
      <div className="h-6 w-32 bg-zinc-900 rounded" />
      <div className="h-40 bg-zinc-900 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="h-96 bg-zinc-900/50 rounded-2xl" />
        <div className="h-96 bg-zinc-900/50 rounded-2xl" />
        <div className="h-96 bg-zinc-900/50 rounded-2xl" />
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center p-5">
      <p className="text-4xl mb-4">🌑</p>
      <h2 className="text-white font-black text-xl mb-2">Cliente não acessível</h2>
      <p className="text-zinc-500 text-center max-w-xs mb-8">{message}</p>
      <Link href="/clientes" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
        Voltar para Lista
      </Link>
    </div>
  )
}

function formatMesAno(mesAno: string) {
  const [ano, mes] = mesAno.split('-')
  const date = new Date(parseInt(ano), parseInt(mes) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').replace(' de ', '/')
}
