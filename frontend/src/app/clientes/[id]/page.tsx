'use client'
// src/app/clientes/[id]/page.tsx
//
// Página de detalhes do cliente. Atua como um mini-CRM.
// Consolida contratos, contatos, faturamentos e projetos.

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { getClientes } from '@/mappers/cliente.mapper'
import { getContratos } from '@/mappers/contrato.mapper'
import { getContatos } from '@/mappers/contato.mapper'
import { getFaturamentos } from '@/mappers/faturamento.mapper'
import { getProjetos } from '@/mappers/projeto.mapper'
import { fetchApi } from '@/services/api'
import { formatCurrency } from '@/utils/finance'
import { getStatusFaturamento } from '@/domain/faturamento'

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

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [allClientes, allContratos, allContatos, allFaturamentos, allProjetos] = await Promise.all([
          fetchApi<Cliente[]>('/clientes', undefined, getClientes()),
          fetchApi<Contrato[]>('/contratos', undefined, getContratos()),
          fetchApi<Contato[]>('/contatos', undefined, getContatos()),
          fetchApi<FaturamentoCliente[]>('/faturamento-cliente', undefined, getFaturamentos()),
          fetchApi<Projeto[]>('/projetos', undefined, getProjetos())
        ])

        if (!isMounted) return

        const foundCliente = allClientes.find(c => c.id === id)
        if (!foundCliente) {
          setError('Cliente não encontrado')
          return
        }

        setCliente(foundCliente)

        const clienteContratos = allContratos.filter(c => c.clienteId === id)
        setContratos(clienteContratos)

        setContatos(allContatos.filter(c => c.clienteId === id))

        // Faturamentos são vinculados a contratos
        const clienteFaturamentos = allFaturamentos.filter(f => 
          clienteContratos.some(c => c.id === f.contratoId)
        )
        setFaturamentos(clienteFaturamentos)

        const clienteProjetos = allProjetos.filter(p => 
          clienteContratos.some(c => c.id === p.contratoId)
        )
        setProjetos(clienteProjetos)

      } catch (err) {
        if (isMounted) {
          console.error('[ERROR][CLIENTE_DETAIL]', err)
          setError('Erro ao carregar os dados do cliente.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [id])

  if (loading) return <LoadingSkeleton />
  if (error || !cliente) return <ErrorState message={error || 'Cliente não encontrado'} />

  // Cálculos para KPIs
  const contratosAtivos = contratos.filter(c => c.status === 'ativo')
  const receitaMensal = contratosAtivos.reduce((acc, c) => acc + c.valor_mensal, 0)
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
        {/* ── HEADER PRINCIPAL (DADOS INSTITUCIONAIS) ── */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 shadow-xl shadow-black/20 relative overflow-hidden">
          {/* Decoração sutil de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-white text-3xl font-black tracking-tight">{cliente.nome_instituicao}</h1>
                <ClienteStatusBadge status={cliente.status} />
              </div>
              <p className="text-zinc-400 text-sm">{cliente.tipo_instituicao} · {cliente.cidade}</p>
              
              {cliente.observacoes_gerais && (
                <div className="mt-4 bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/50">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Observações Gerais</p>
                  <p className="text-zinc-300 text-sm italic">{cliente.observacoes_gerais}</p>
                </div>
              )}
            </div>
            
            {cliente.nivel_complexidade && (
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Complexidade</p>
                <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-700/50">
                  {cliente.nivel_complexidade}
                </span>
              </div>
            )}
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
                          <p className="text-zinc-200 font-bold">{formatCurrency(c.valor_mensal)}</p>
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
              <SectionHeader label="Contatos" />
              <div className="space-y-3 mt-4">
                {contatos.length > 0 ? (
                  contatos.map(contato => (
                    <div key={contato.id} className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-bold">{contato.nome}</p>
                          {contato.cargo && <p className="text-zinc-500 text-xs">{contato.cargo}</p>}
                        </div>
                        <PapelBadge papel={contato.papel} />
                      </div>
                      <div className="mt-3 space-y-1">
                        {contato.telefone_whatsapp && (
                          <p className="text-zinc-400 text-xs flex items-center gap-2">
                            <span className="text-emerald-500">WA:</span> {contato.telefone_whatsapp}
                          </p>
                        )}
                        {contato.email && (
                          <p className="text-zinc-400 text-xs flex items-center gap-2">
                            <span className="text-sky-500">@</span> {contato.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
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
