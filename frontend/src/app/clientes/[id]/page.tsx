'use client'

// Página de detalhes do cliente. Consolida contratos, contatos, faturamentos e projetos.

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
import { ContractCreateManager } from '@/components/ContractCreateManager'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'

import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { Contato } from '@/domain/contato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Projeto } from '@/domain/projeto'

function getComplexidadeColor(nivel?: string) {
  if (!nivel) return 'bg-sky-500'
  const normalizado = nivel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (normalizado === 'alta') return 'bg-rose-500'
  if (normalizado === 'media') return 'bg-amber-500'
  return 'bg-sky-500' // baixa
}

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
  const [isContractDrawerOpen, setIsContractDrawerOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>()
  const [notasEditando, setNotasEditando] = useState(false)
  const [notasTexto, setNotasTexto] = useState('')
  const [notasSalvando, setNotasSalvando] = useState(false)
  const [expandedContactNotes, setExpandedContactNotes] = useState<Record<string, boolean>>({})

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
      setContatos(allContatos)

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
  const projetosAtivos = projetos.filter(p => p.status === 'em andamento')

  const notasAtuais = cliente.observacoes_gerais || ''

  async function salvarNotas() {
    setNotasSalvando(true)
    try {
      await ClientesService.update(id, { ...cliente, observacoes_gerais: notasTexto })
    } catch (err) {
      console.error('[NOTAS] Erro ao salvar:', err)
    } finally {
      setNotasSalvando(false)
      setNotasEditando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      {/* ── HEADER DE NAVEGAÇÃO ── */}
      <div className="px-5 pt-12 pb-4">
        <Link 
          href="/clientes" 
          className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-sky-500 transition-colors inline-flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft size={10} strokeWidth={3} />
          Voltar para clientes
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
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/70 text-sm font-medium mb-8">
                <span className="flex items-center gap-2">
                   <span className="size-1.5 rounded-full bg-sky-500" />
                   {cliente.tipo_instituicao}
                </span>
                <span className="flex items-center gap-2">
                   <span className="size-1.5 rounded-full bg-sky-500" />
                   {cliente.cidade}
                </span>
                {cliente.nivel_complexidade && (
                  <span className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${getComplexidadeColor(cliente.nivel_complexidade)}`} />
                    Complexidade {cliente.nivel_complexidade}
                  </span>
                )}
              </div>

              {notasEditando ? (
                <div className="bg-black/20 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
                  <p className="text-[10px] md:text-[11px] font-black text-sky-400 uppercase tracking-widest mb-2">Notas Operacionais</p>
                  <textarea
                    autoFocus
                    value={notasTexto}
                    onChange={e => setNotasTexto(e.target.value)}
                    onBlur={salvarNotas}
                    rows={4}
                    placeholder="Contexto, dinâmica institucional, o que o sistema não captura..."
                    className="w-full bg-transparent text-zinc-200 text-sm leading-relaxed italic resize-none focus:outline-none placeholder-zinc-700"
                  />
                  <p className="text-[9px] md:text-[10px] text-sky-500 mt-2 uppercase tracking-widest">{notasSalvando ? 'Salvando...' : 'Salvo ao perder foco'}</p>
                </div>
              ) : (
                <div
                  onClick={() => { setNotasTexto(notasAtuais); setNotasEditando(true) }}
                  className="cursor-pointer group"
                >
                  {notasAtuais ? (
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/5 backdrop-blur-sm group-hover:border-zinc-700/80 group-hover:bg-zinc-900/10 transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] md:text-[11px] font-black text-sky-600 uppercase tracking-widest group-hover:text-sky-400 transition-colors">Notas Operacionais</p>
                        <Pencil size={11} className="text-zinc-500 group-hover:text-sky-500 transition-colors" />
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed italic">
                        &quot;{notasAtuais}&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl p-4 border border-dashed border-zinc-800 group-hover:border-zinc-700 group-hover:bg-zinc-900/10 transition-all duration-300 flex items-center justify-between">
                      <p className="text-zinc-700 text-xs italic group-hover:text-zinc-500 transition-colors">Toque para adicionar notas operacionais...</p>
                      <Pencil size={11} className="text-zinc-700 group-hover:text-sky-500 transition-colors" />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button 
                onClick={() => setIsClientDrawerOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-white/10 transition-all active:scale-[0.98]"
              >
                <Pencil size={12} />
                Editar Dados
              </button>
              <button 
                onClick={() => {
                  setSelectedContactId(undefined)
                  setIsContactDrawerOpen(true)
                }}
                className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-sky-900/20 active:scale-[0.98]"
              >
                <Plus size={14} strokeWidth={3} />
                Adicionar Contato
              </button>
              {cliente.status === 'inativo' ? (
                <button 
                  onClick={async () => {
                    if (confirm('Deseja realmente reativar esta instituição no painel de ativos?')) {
                      try {
                        const updated = await ClientesService.update(id, { ...cliente, status: 'ativo' })
                        setCliente(updated)
                        loadData()
                      } catch {
                        alert('Erro ao reativar cliente.')
                      }
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-emerald-500/20 transition-all active:scale-[0.98] shadow-lg shadow-emerald-950/10"
                >
                  Reativar Instituição
                </button>
              ) : (
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
                  className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-red-500/20 transition-all active:scale-[0.98]"
                >
                  <Trash2 size={12} />
                  Arquivar Instituição
                </button>
              )}
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
            <div className="flex justify-between items-center gap-3">
              <div className="flex-1">
                <SectionHeader label="Contratos" />
              </div>
              <button 
                onClick={() => setIsContractDrawerOpen(true)}
                className="flex items-center gap-1 bg-sky-600/90 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-1.5 transition-all shadow-lg shadow-sky-950/20 active:scale-95 shrink-0"
              >
                <Plus size={11} className="stroke-3" />
                Novo
              </button>
            </div>
            <div className="space-y-3">
              {contratos.length > 0 ? (
                contratos.slice(0, 3).map(c => (
                  <Link key={c.id} href={`/contratos/${c.id}`} className="block group">
                    <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 transition-colors group-hover:bg-zinc-800/40 group-hover:border-zinc-700">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">#{c.id}</span>
                        <ContratoStatusBadge status={c.status || ''} />
                      </div>
                      <p className="text-white font-bold text-sm mb-1 line-clamp-1">{c.servicos_contratados}</p>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] md:text-[11px] text-sky-500 uppercase font-black tracking-widest mb-0.5">Valor Mensal</p>
                          <p className="text-zinc-200 font-bold">{formatCurrency(c.valor_mensal || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] md:text-[11px] text-sky-500 uppercase font-black tracking-widest mb-0.5">Visitas/mês</p>
                          <p className="text-zinc-200 font-bold">{c.visitas_previstas_mes}</p>
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
                {(() => {
                  const prioridadePapel: Record<string, number> = {
                    'Decisor': 1,
                    'Financeiro': 2,
                    'Influenciador': 3,
                    'Técnico': 4,
                    'Operacional': 5,
                  }
                  
                  const contatosOrdenados = [...contatos].sort((a, b) => {
                    const pa = prioridadePapel[a.papel] || 999
                    const pb = prioridadePapel[b.papel] || 999
                    return pa - pb
                  })

                  return contatosOrdenados.length > 0 ? (
                    contatosOrdenados.map(contato => {
                      // Extrai tags das observações para exibição
                      const match = (contato.observacoes_gerais || '').match(/^\[(.*?)\]/)
                    const tags = match ? match[1].split(',').map(t => t.trim()) : []
                    const cleanObs = (contato.observacoes_gerais || '').replace(/^\[.*?\]\s*/, '')
                    
                    // M2: Sanitização robusta do WhatsApp
                    const cleanNum = (contato.telefone_whatsapp || '').replace(/\D/g, '')
                    const finalNum = cleanNum.startsWith('55') ? cleanNum : `55${cleanNum}`
                    const isObsExpanded = !!expandedContactNotes[contato.id]

                    return (
                      <div 
                        key={contato.id} 
                        onClick={() => {
                           setSelectedContactId(contato.id)
                           setIsContactDrawerOpen(true)
                        }}
                        className="group border rounded-xl p-4 transition-all cursor-pointer bg-zinc-900/30 border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-800/15 duration-300"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-white font-bold text-sm group-hover:text-sky-400 transition-colors">{contato.nome}</p>
                                <Pencil size={10} className="text-zinc-700 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0" />
                              </div>
                              {contato.cargo && <p className="text-sky-600 text-[10px] font-bold uppercase tracking-widest">{contato.cargo}</p>}
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

                        <div className="mt-4 flex flex-wrap gap-4" onClick={e => e.stopPropagation()}>
                          {contato.telefone_whatsapp && (
                            <>
                              {/* WA Link Sanitizado */}
                              <a 
                                href={`https://wa.me/${finalNum}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-emerald-400 text-xs flex items-center gap-1.5 transition-colors group/wa"
                              >
                                <span className="text-emerald-500 text-[10px] font-black uppercase group-hover/wa:underline">WA:</span> 
                                <span className="font-medium group-hover/wa:underline">{contato.telefone_whatsapp}</span>
                              </a>

                              {/* M3: Ligação Telefônica Direta */}
                              <a 
                                href={`tel:${cleanNum}`}
                                className="text-zinc-300 hover:text-sky-400 text-xs flex items-center gap-1.5 transition-colors group/tel"
                              >
                                <span className="text-sky-500 text-[10px] md:text-[11px] font-black uppercase group-hover/tel:underline">Tel:</span> 
                                <span className="font-medium group-hover/tel:underline">{contato.telefone_whatsapp}</span>
                              </a>
                            </>
                          )}
                          {contato.email && (
                            <a 
                              href={`mailto:${contato.email}`}
                              className="text-zinc-300 hover:text-sky-400 text-xs flex items-center gap-1.5 transition-colors group/mail"
                            >
                              <span className="text-sky-500 text-[10px] md:text-[11px] font-black uppercase group-hover/mail:underline">@</span> 
                              <span className="font-medium truncate max-w-[150px] group-hover/mail:underline">{contato.email}</span>
                            </a>
                          )}
                        </div>

                        {cleanObs && (
                          /* M4: Expansão sem conflito com e.stopPropagation */
                          <p 
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedContactNotes(prev => ({
                                ...prev,
                                [contato.id]: !prev[contato.id]
                              }))
                            }}
                            className={`mt-3 text-[11px] text-zinc-500 italic leading-relaxed border-t border-white/5 pt-3 cursor-pointer transition-all duration-300 ${
                              isObsExpanded ? 'line-clamp-none' : 'line-clamp-1 group-hover:line-clamp-none'
                            }`}
                          >
                            &quot;{cleanObs}&quot;
                          </p>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <EmptyCard message="Nenhum contato vinculado" />
                )
                })()}
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
                          <div className="flex items-center gap-1.5 shrink-0">
                            {p.isExtra && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border text-amber-500 bg-amber-500/10 border-amber-500/20">
                                EXTRA
                              </span>
                            )}
                            <ProjetoStatusBadge status={p.status} />
                          </div>
                        </div>
                        <p className="text-zinc-300 font-bold text-xs md:text-sm mt-4">{formatCurrency(p.valor_total)}</p>
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
              {(() => {
                const faturamentosOrdenados = [...faturamentos].sort((a, b) => b.mes_ano.localeCompare(a.mes_ano))
                const ultimaPaga = faturamentosOrdenados.find(f => getStatusFaturamento(f) === 'pago')
                const ultimasAtrasadas = faturamentosOrdenados
                  .filter(f => getStatusFaturamento(f) === 'atrasado')
                  .slice(0, 3)

                const exibidos: FaturamentoCliente[] = []
                if (ultimaPaga) exibidos.push(ultimaPaga)
                exibidos.push(...ultimasAtrasadas)
                exibidos.sort((a, b) => b.mes_ano.localeCompare(a.mes_ano))

                if (exibidos.length === 0) {
                  return <div className="p-4"><EmptyCard message="Nenhum faturamento crítico registrado" /></div>
                }

                return (
                  <div className="divide-y divide-zinc-800/50">
                    {exibidos.map(f => {
                      const status = getStatusFaturamento(f)
                      return (
                        <div key={f.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                          <div>
                            <p className="text-white text-sm font-bold">{formatMesAno(f.mes_ano)}</p>
                            <p className="text-[10px] md:text-[11px] text-zinc-300 font-medium uppercase tracking-widest mt-2">Contrato #{f.contratoId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-zinc-200 font-black text-sm">{formatCurrency(f.valor_total)}</p>
                            <FaturamentoStatusText status={status} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
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

      <OperationalDrawer
        isOpen={isContractDrawerOpen}
        onClose={() => setIsContractDrawerOpen(false)}
        title="Novo Contrato"
      >
        <ContractCreateManager
          clienteId={id}
          onClose={() => setIsContractDrawerOpen(false)}
          onSuccess={(novoContrato) => {
            setContratos(prev => [novoContrato, ...prev])
            loadData()
          }}
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
      <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mt-1">{label}</p>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-[11px] md:text-[12px] font-black uppercase tracking-widest text-zinc-200 shrink-0">{label}</h2>
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
    'em andamento': 'text-sky-400 bg-sky-900/30 border-sky-800/30',
    'concluído': 'text-emerald-400 bg-emerald-900/30 border-emerald-800/30',
    cancelado: 'text-red-400 bg-red-900/30 border-red-800/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors[status] || colors['em andamento']}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PapelBadge({ papel }: { papel: string }) {
  let colorClass = 'text-zinc-300 bg-zinc-800 border-zinc-700/50' // Operacional ou default
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