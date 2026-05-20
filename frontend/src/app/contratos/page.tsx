'use client'

// Refatoração estrutural completa para alinhar com o novo mapa lógico.
// Focado em registro contratual puro, sem lógica financeira (agora em FaturamentoCliente).

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ContratoService } from '@/services/contrato.service'
import { ClientesService } from '@/services/clientes.service'
import { FaturamentosService } from '@/services/faturamento.service'
import { getFaturamentoMaisRecente, getStatusFaturamento } from '@/domain/faturamento'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { ContractCreateManager } from '@/components/ContractCreateManager'
import { Plus } from 'lucide-react'
import { displayDate } from '@/utils/date'

type ContratoComCliente = Contrato & { clienteNome: string }

export default function ContratosPage() {
  const [contratos, setContratos] = useState<ContratoComCliente[]>([])
  const [faturamentos, setFaturamentos] = useState<FaturamentoCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Novos estados para criação a partir da listagem global
  const [clientes, setClientes] = useState<{ id: string; nome_instituicao: string }[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')

  const filteredContratos = useMemo(() => {
    let items = contratos

    if (selectedClient) {
      items = items.filter(c => c.clienteId === selectedClient)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      items = items.filter(c => {
        const matchesClient = c.clienteNome.toLowerCase().includes(term)
        const matchesServices = c.servicos_contratados.toLowerCase().includes(term)
        const matchesObs = c.observacoes_gerais ? c.observacoes_gerais.toLowerCase().includes(term) : false
        return matchesClient || matchesServices || matchesObs
      })
    }

    return items
  }, [contratos, selectedClient, searchTerm])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [todosContratos, clientesDados, fatDados] = await Promise.all([
          ContratoService.getAll(),
          ClientesService.getAll(),
          FaturamentosService.getAll()
        ])

        if (!isMounted) return

        const clienteNomePorId = new Map(clientesDados.map(c => [c.id, c.nome_instituicao]))

        const comNome: ContratoComCliente[] = todosContratos.map(c => ({
          ...c,
          clienteNome: clienteNomePorId.get(c.clienteId) ?? `Cliente ${c.clienteId}`,
        }))

        setContratos(comNome)
        setFaturamentos(fatDados)
        setClientes(clientesDados.map(c => ({ id: c.id, nome_instituicao: c.nome_instituicao })))
      } catch (err) {
        if (isMounted) {
          console.warn('[WARN][CONTRATOS] Erro ao carregar dados:', err)
          setError('Não foi possível carregar os dados dos contratos.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  const handleContractCreated = (novoContrato: Contrato) => {
    const cNome = clientes.find(c => c.id === novoContrato.clienteId)?.nome_instituicao ?? `Cliente ${novoContrato.clienteId}`
    const contratoComNome: ContratoComCliente = {
      ...novoContrato,
      clienteNome: cNome
    }
    setContratos(prev => [contratoComNome, ...prev])
    FaturamentosService.getAll()
      .then(setFaturamentos)
      .catch(err => console.warn('[WARN][CONTRATOS] Erro ao sincronizar faturamentos:', err))
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedClienteId(null)
    setSearchQuery('')
  }

  const filteredClientes = clientes.filter(c => 
    c.nome_instituicao.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-32 text-zinc-300">
      {/* ── HEADER ── */}
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-end justify-between mb-2">
            <h1 className="text-white text-3xl font-black tracking-tight">Contratos</h1>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest px-4 py-2 transition-all shadow-lg shadow-sky-950/20"
          >
            <Plus className="w-5 h-5 stroke-3" />
            Novo Contrato
          </button>
        </div>
        
        <div className="flex items-start justify-start mt-4">
          <p className="text-zinc-400 text-sm font-medium">Gestão e acompanhamento operacional</p>
        </div>
      </header>

      {/* ── BARRA DE BUSCA E FILTRO DE CLIENTE ── */}
      <div className="px-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            placeholder="Buscar por cliente, serviços ou observações..."
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

      <div className="px-5 pt-6 space-y-8">
        {/* ── ERROR ALERT ── */}
        {error && (
          <div className="bg-red-950/40 border border-red-700/50 rounded-2xl px-4 py-3 text-red-400 text-sm">
            <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Aviso</p>
            {error}
          </div>
        )}

        {/* ── GRID DE CARDS ── */}
        {filteredContratos.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredContratos.map(contrato => (
              <ContratoCard 
                key={contrato.id} 
                contrato={contrato} 
                faturamento={getFaturamentoMaisRecente(faturamentos, contrato.id)} 
              />
            ))}
          </section>
        ) : (
          <div className="py-20 text-center">
            <p className="text-zinc-400 text-sm font-medium italic">
              {searchTerm || selectedClient ? "Nenhum contrato atende aos termos de busca." : "Nenhum contrato encontrado."}
            </p>
          </div>
        )}
      </div>

      <OperationalDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title="Novo Contrato"
      >
        {!selectedClienteId ? (
          <div className="space-y-6">
            <p className="text-xs md:text-[12px] text-sky-500 leading-relaxed">
              Selecione o cliente ao qual este contrato será vinculado para iniciar o cadastro.
            </p>
            {/* Campo de Busca Rápida */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-500 placeholder-zinc-300 transition-colors"
              />
            </div>
            {/* Lista de Clientes */}
            <div className="space-y-2 max-h-[350px] md:max-h-[700px] overflow-y-auto pr-1">
              {filteredClientes.length > 0 ? (
                filteredClientes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClienteId(c.id)}
                    className="w-full text-left bg-zinc-900/30 hover:bg-zinc-800/40 border border-zinc-800/50 hover:border-zinc-700/50 rounded-xl p-3.5 mb-3 flex justify-between items-center group transition-all"
                  >
                    <span className="text-white text-xs font-bold group-hover:text-sky-400 transition-colors">
                      {c.nome_instituicao}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-600 group-hover:text-sky-400 transition-colors">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))
              ) : (
                <p className="text-xs text-zinc-400 text-center py-6">Nenhum cliente encontrado.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-3">
              <p className="text-xs text-zinc-200 font-bold truncate">
                Cliente: <span className="text-sky-400">{clientes.find(c => c.id === selectedClienteId)?.nome_instituicao}</span>
              </p>
              <button
                onClick={() => setSelectedClienteId(null)}
                className="text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors"
              >
                Alterar
              </button>
            </div>
            <ContractCreateManager
              clienteId={selectedClienteId}
              onClose={handleCloseDrawer}
              onSuccess={handleContractCreated}
            />
          </div>
        )}
      </OperationalDrawer>
    </main>
  )
}

function ContratoCard({ contrato, faturamento }: { contrato: ContratoComCliente; faturamento?: FaturamentoCliente }) {
  return (
    <Link href={`/contratos/${contrato.id}`} className="block h-full">
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all group active:scale-[0.99] flex flex-col justify-between h-full min-h-[220px]">
        <div>
          <div className="flex justify-between items-start mb-6 gap-3">
            <div className="min-w-0">
              <h3 className="text-white font-bold text-xl leading-tight truncate group-hover:text-sky-400 transition-colors">
                {contrato.clienteNome}
              </h3>
              <div className="flex items-baseline gap-1 mt-5">
                <span className="text-[12px] font-black uppercase tracking-widest text-amber-500">Serviços:</span>
                <p className="text-zinc-300 text-[11px] md:text-[12px] font-medium truncate">
                  {contrato.servicos_contratados}
                </p>
              </div>
            </div>
            {contrato.inclui_relatorio && (
              <span className="shrink-0 bg-blue-900/40 text-blue-400 border border-blue-800/30 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                Relatório
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-500 mb-1">Visitas Mensais</p>
              <p className="text-white font-black tabular-nums text-lg">
                {contrato.visitas_previstas_mes} <span className="text-zinc-300 text-xs md:text-[12px] font-bold tracking-normal">visitas</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-500 mb-1">Vigência</p>
              <p className="text-white text-sm font-bold tabular-nums">
                {displayDate(contrato.data_inicio)}
              </p>
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-500 mb-1">Data Fim</p>
              <p className="text-white text-sm font-bold tabular-nums truncate">
                {contrato.data_fim ? displayDate(contrato.data_fim) : 'Indeterminado'}
              </p>
            </div>
          </div>

          {contrato.observacoes_gerais && (
            <div className="mt-6 pt-4 border-t border-zinc-800/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Observações</p>
              <p className="text-zinc-500 text-xs leading-relaxed italic line-clamp-2">
                &quot;{contrato.observacoes_gerais}&quot;
              </p>
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-200">Faturamento:</p>
            {faturamento ? (
              <StatusBadgeLocal variant={getStatusFaturamento(faturamento)} />
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg">
                Sem dados
              </span>
            )}
          </div>
          
          <div className="text-[11px] font-black uppercase tracking-widest text-sky-500 flex items-center gap-1 group/btn">
            Ver detalhes
            <svg className="group-hover/btn:translate-x-0.5 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatusBadgeLocal({ variant }: { variant: string }) {
  const styles: Record<string, string> = {
    pago:      'bg-emerald-900/40 text-emerald-400 border-emerald-800/30',
    pendente:  'bg-amber-900/40 text-amber-400 border-amber-800/30',
    atrasado:  'bg-red-900/40 text-red-400 border-red-800/30',
  }

  const labels: Record<string, string> = {
    pago:      '✓ Pago',
    pendente:  'Pendente',
    atrasado:  'Atrasado',
  }

  const style = styles[variant] || 'bg-zinc-800 text-zinc-400'
  const label = labels[variant] || variant

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${style} whitespace-nowrap`}>
      {label}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <header className="px-5 pt-10 pb-4 border-b border-zinc-800/50">
        <div className="h-6 w-32 bg-zinc-900 rounded animate-pulse" />
      </header>
      <div className="px-5 pt-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-56 bg-zinc-900/40 border border-zinc-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  )
}