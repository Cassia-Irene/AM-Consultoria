'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  AnalyticsService, 
  type DashboardSummary, 
  type FinancialMonth,
  type ActiveProject
} from '@/services/analytics.service'
import { FaturamentosService } from '@/services/faturamento.service'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { ParcelasService } from '@/services/parcelas.service'
import { getStatusFaturamento, type FaturamentoCliente } from '@/domain/faturamento'
import type { Contrato } from '@/domain/contrato'
import type { Cliente } from '@/domain/cliente'
import type { ProjetoParcela } from '@/domain/projetoParcela'



function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

const MONTHS_PT = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' }
]

// Título da Seção: Projetos em Andamento
function SectionHeader({ label, badge }: { label: string; badge?: string | number }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-200">{label}</h2>
        {badge !== undefined && (
          <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] md:text-[11px] font-black px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

import Link from 'next/link'

function FinanceCard({ 
  label, 
  value, 
  description, 
  color, 
  isCurrency = true,
  href
}: { 
  label: string; 
  value: number; 
  description: string; 
  color: 'sky' | 'amber' | 'emerald'; 
  isCurrency?: boolean;
  href?: string
}) {
  const colors = {
    sky: 'text-sky-400 border-sky-900/50 bg-sky-950/10 hover:border-sky-500',
    amber: 'text-amber-400 border-amber-900/50 bg-amber-950/10 hover:border-amber-500',
    emerald: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/10 hover:border-emerald-500',
  }

  const content = (
    <div className={`rounded-3xl border p-6 h-full transition-all duration-300 ${colors[color]} ${href ? 'cursor-pointer active:scale-[0.98]' : ''}`}>
      <div className="flex justify-between items-start mb-1 md:mb-3">
        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{label}</p>
        {href && (
          <span className="text-[10px] font-black uppercase tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded-lg">Agir</span>
        )}
      </div>
      <p className="text-3xl font-black tabular-nums tracking-tighter mb-2 md:mb-3">
        {isCurrency ? formatCurrency(value) : value}
      </p>
      <p className="text-[10px] md:text-[11px] text-zinc-300 font-medium leading-relaxed">{description}</p>
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>
  }

  return content
}

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [finance, setFinance] = useState<FinancialMonth[]>([])
  const [projects, setProjects] = useState<ActiveProject[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  
  const [allFaturamentos, setAllFaturamentos] = useState<FaturamentoCliente[]>([])
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [allContratos, setAllContratos] = useState<Contrato[]>([])
  const [allParcelas, setAllParcelas] = useState<ProjetoParcela[]>([])
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.cliente))).sort()
  }, [projects])

  const filteredProjects = useMemo(() => {
    let items = projects

    if (selectedClient) {
      items = items.filter(p => p.cliente === selectedClient)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      items = items.filter(p => {
        const matchesClient = p.cliente.toLowerCase().includes(term)
        const matchesTitle = p.projeto.toLowerCase().includes(term)
        return matchesClient || matchesTitle
      })
    }

    return items
  }, [projects, selectedClient, searchTerm])

  const displayedProjects = useMemo(() => {
    return filteredProjects.slice(0, 10)
  }, [filteredProjects])

  const sortedFinance = useMemo(() => {
    return [...finance].sort((a, b) => {
      const cleanA = a.mes.split('T')[0]
      const cleanB = b.mes.split('T')[0]
      return cleanA.localeCompare(cleanB)
    })
  }, [finance])

  const uniqueYears = useMemo(() => {
    const years = finance.map(f => f.mes.substring(0, 4))
    return Array.from(new Set(years)).sort()
  }, [finance])

  const filteredFinance = useMemo(() => {
    let items = sortedFinance

    if (selectedMonth) {
      const matchMonth = String(Number(selectedMonth) + 1).padStart(2, '0')
      items = items.filter(f => f.mes.substring(5, 7) === matchMonth)
    }

    if (selectedYear) {
      items = items.filter(f => f.mes.substring(0, 4) === selectedYear)
    }

    return items
  }, [sortedFinance, selectedMonth, selectedYear])

  const getYearMonth = (dateStr: string) => {
    if (!dateStr) return ''
    return dateStr.substring(0, 7)
  }

  const isContractActiveInMonth = (contrato: Contrato, yearMonthStr: string) => {
    const parseDateUTC = (dateStr: string) => {
      const clean = dateStr.split('T')[0].split(' ')[0]
      const [y, m, d] = clean.split('-').map(Number)
      return new Date(Date.UTC(y, m - 1, d || 1))
    }

    const [y, m] = yearMonthStr.split('-').map(Number)
    const targetMonthFirst = new Date(Date.UTC(y, m - 1, 1))
    const targetMonthLast = new Date(Date.UTC(y, m, 0))

    const start = parseDateUTC(contrato.data_inicio)
    if (start > targetMonthLast) return false

    if (contrato.data_fim) {
      const end = parseDateUTC(contrato.data_fim)
      if (end < targetMonthFirst) return false
    }

    if (contrato.status === 'inativo') return false

    return true
  }

  const formatMonthYearSafe = (dateStr: string) => {
    if (!dateStr) return ''
    const clean = dateStr.split('T')[0]
    const [y, m] = clean.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1, 1))
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }

  const getMonthDetailItens = (mesStr: string) => {
    const targetYM = getYearMonth(mesStr)
    
    // 1. Faturamentos gerados (Recorrente)
    const faturados = allFaturamentos
      .filter(fat => getYearMonth(fat.mes_ano) === targetYM)
      .map(fat => {
        const contrato = allContratos.find(c => String(c.id) === String(fat.contratoId))
        const cliente = allClientes.find(c => String(c.id) === String(contrato?.clienteId))
        
        let status: 'pago' | 'atrasado' | 'pendente' = 'pendente'
        if (fat.pago) {
          status = 'pago'
        } else {
          const [ano, mes] = fat.mes_ano.split('-').map(Number)
          const vencimento = new Date(Date.UTC(ano, mes - 1, 10))
          const hoje = new Date()
          status = hoje.getTime() > vencimento.getTime() ? 'atrasado' : 'pendente'
        }

        return {
          clienteNome: cliente?.nome_instituicao ?? `Cliente (Contrato #${fat.contratoId})`,
          clienteId: cliente?.id,
          valor: Number(fat.valor_total),
          status,
          contratoId: fat.contratoId,
          isProjeto: false,
          projetoTitulo: ''
        }
      })

    // 2. Contratos ativos sem faturamento
    const naoFaturados = allContratos
      .filter(c => {
        const active = isContractActiveInMonth(c, targetYM)
        const alreadyFaturado = allFaturamentos.some(fat => {
          return String(fat.contratoId) === String(c.id) && getYearMonth(fat.mes_ano) === targetYM
        })
        return active && !alreadyFaturado
      })
      .map(c => {
        const cliente = allClientes.find(cli => String(cli.id) === String(c.clienteId))
        return {
          clienteNome: cliente?.nome_instituicao ?? `Cliente (Contrato #${c.id})`,
          clienteId: cliente?.id,
          valor: Number(c.valor_mensal),
          status: 'nao_faturado' as const,
          contratoId: c.id,
          isProjeto: false,
          projetoTitulo: ''
        }
      })

    // 3. Parcelas de Projetos (Receita Variável)
    const parcelas = allParcelas
      .filter(p => getYearMonth(p.data_pagamento_prevista) === targetYM)
      .map(p => {
        const projeto = projects.find(proj => String(proj.id) === String(p.projetoId))
        const clienteNome = projeto?.cliente ?? `Cliente (Projeto #${p.projetoId})`
        
        let status: 'pago' | 'atrasado' | 'pendente' = 'pendente'
        if (p.pago) {
          status = 'pago'
        } else {
          const [ano, mes, dia] = p.data_pagamento_prevista.split('-').map(Number)
          const vencimento = new Date(Date.UTC(ano, mes - 1, dia || 10))
          const hoje = new Date()
          status = hoje.getTime() > vencimento.getTime() ? 'atrasado' : 'pendente'
        }

        return {
          clienteNome,
          clienteId: projeto?.idContrato ? allContratos.find(c => String(c.id) === String(projeto.idContrato))?.clienteId : undefined,
          valor: Number(p.valor_parcela),
          status,
          contratoId: undefined,
          isProjeto: true,
          projetoTitulo: projeto?.projeto ?? `Parcela #${p.numero_parcela}`
        }
      })

    return [...faturados, ...naoFaturados, ...parcelas].sort((a, b) => b.valor - a.valor)
  }

  useEffect(() => {
    async function load() {
      try {
        const [s, f, p, fat, cli, con, par] = await Promise.all([
          AnalyticsService.getSummary(),
          AnalyticsService.getFinance(),
          AnalyticsService.getProjects(),
          FaturamentosService.getAll(),
          ClientesService.getAll(),
          ContratoService.getAll(),
          ParcelasService.getAll()
        ])
        setSummary(s)
        setFinance(f)
        setProjects(p)
        setAllFaturamentos(fat)
        setAllClientes(cli)
        setAllContratos(con)
        setAllParcelas(par)
      } catch (err) {
        console.error('Erro no financeiro:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const dynamicInadimplenciaCount = useMemo(() => {
    // 1. Clientes com faturamento de contrato atrasado
    const clientesContratoAtrasado = allFaturamentos.filter(fat => {
      if (fat.pago) return false
      const statusF = getStatusFaturamento(fat)
      return statusF === 'atrasado'
    }).map(fat => {
      const contrato = allContratos.find(c => String(c.id) === String(fat.contratoId))
      const cliente = allClientes.find(c => String(c.id) === String(contrato?.clienteId))
      return cliente?.nome_instituicao
    }).filter(Boolean) as string[]

    // 2. Clientes com parcelas de projeto atrasadas
    const clientesProjetoAtrasado = allParcelas.filter(p => {
      if (p.pago) return false
      const vencimento = new Date(p.data_pagamento_prevista.split('T')[0])
      const hoje = new Date()
      
      const hojeDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const vencimentoDate = new Date(vencimento.getFullYear(), vencimento.getMonth(), vencimento.getDate())
      
      return vencimentoDate < hojeDate
    }).map(p => {
      const project = projects.find(proj => String(proj.id) === String(p.projetoId))
      return project?.cliente
    }).filter(Boolean) as string[]

    // 3. Unir e pegar os únicos
    const uniqueOverdueClients = Array.from(new Set([...clientesContratoAtrasado, ...clientesProjetoAtrasado]))
    return uniqueOverdueClients.length
  }, [allFaturamentos, allContratos, allClientes, allParcelas, projects])

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-emerald-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Consolidando Receitas...</span>
      </div>
    )
  }


  return (
    <main className="min-h-screen bg-[#07090D] pb-32">


      <header className="px-5 pt-8 pb-8">
        <h1 className="text-white text-3xl font-black tracking-tight">Financeiro</h1>
        <p className="text-zinc-400 text-sm mt-4">Visão estratégica e saúde financeira</p>
      </header>

      <div className="px-5 space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinanceCard 
            label="Receita Mensal (MRR)" 
            value={Number(summary.faturamentoMes)} 
            description="Total recorrente de contratos ativos"
            color="sky"
          />
          <FinanceCard 
            label="Inadimplência" 
            value={dynamicInadimplenciaCount} 
            description="Clientes com pendências financeiras"
            color="amber"
            isCurrency={false}
            href="/financeiro/inadimplencia?status=vencidas"
          />
          <FinanceCard 
            label="Histórico Total" 
            value={finance.reduce((acc, f) => acc + Number(f.receitaTotal), 0)} 
            description="Receita total acumulada registrada"
            color="emerald"
          />
        </section>

        {/* ── BARRA DE BUSCA E FILTRO DE CLIENTE (PROJETOS FINANCEIRO) ── */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                placeholder="Buscar por projeto..."
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
                {uniqueClients.map(client => (
                  <option key={client} value={client} className="bg-[#07090D] text-white">
                    {client}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(searchTerm || selectedClient) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedClient('')
              }}
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-1.5 transition-colors font-semibold"
            >
              Limpar Filtros de Busca
            </button>
          </div>
        )}

        {/* Seção de Projetos Ativos */}
        {displayedProjects.length > 0 ? (
          <section>
            <SectionHeader label="Projetos em Andamento" badge={filteredProjects.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedProjects.map((proj, i) => (
                <Link 
                  href={`/projetos/${proj.id}`} 
                  key={i} 
                  className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-sky-500/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-sky-500/2 flex flex-col cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-zinc-300 text-[10px] md:text-[11px] font-black uppercase tracking-widest">{proj.cliente}</p>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-[9px] font-black uppercase tracking-tighter">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-4 leading-tight">{proj.projeto}</h3>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
                    <span className="text-zinc-300 text-[10px] md:text-[11px] font-medium uppercase">Valor Total</span>
                    <span className="text-white font-black text-sm tabular-nums">{formatCurrency(Number(proj.valorTotal))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : projects.length > 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800/60 rounded-3xl">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Nenhum projeto encontrado para os filtros selecionados.</p>
          </div>
        ) : null}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-200">Histórico Mensal</h2>
              <div className="hidden sm:block flex-1 h-px bg-zinc-800" />
            </div>
            <div className="flex items-center gap-3">
              <select
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                title="Filtrar por Mês"
              >
                <option value="">Todos os Meses</option>
                {MONTHS_PT.map(m => (
                  <option key={m.value} value={m.value} className="bg-[#07090D] text-white">
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                title="Filtrar por Ano"
              >
                <option value="">Todos os Anos</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y} className="bg-[#07090D] text-white">
                    {y}
                  </option>
                ))}
              </select>

              {(selectedMonth || selectedYear) && (
                <button
                  onClick={() => {
                    setSelectedMonth('')
                    setSelectedYear('')
                  }}
                  className="text-[10px] text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 transition-colors font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredFinance.length > 0 ? (
              filteredFinance.map((f, i) => {
                const isExpanded = expandedMonth === f.mes
                const detailItens = getMonthDetailItens(f.mes)
                
                const totalEsperadoRecorrente = detailItens.reduce((acc, curr) => acc + curr.valor, 0)
                const totalPago = detailItens.filter(x => x.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0)
                const totalPendente = detailItens.filter(x => x.status !== 'pago').reduce((acc, curr) => acc + curr.valor, 0)

                const dynamicRecorrente = detailItens
                  .filter(x => !x.isProjeto)
                  .reduce((acc, curr) => acc + curr.valor, 0)

                const dynamicTotal = totalEsperadoRecorrente

                return (
                  <div key={i} className={`bg-zinc-900/40 border ${isExpanded ? 'border-zinc-700/60 bg-zinc-900/60 shadow-lg' : 'border-zinc-800/50 hover:border-zinc-700/40'} rounded-3xl p-4 sm:p-5 transition-all`}>
                    <div 
                      onClick={() => setExpandedMonth(isExpanded ? null : f.mes)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-xl flex items-center justify-center border ${isExpanded ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'} transition-colors`}>
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            className={`transform transition-transform ${isExpanded ? 'rotate-90 text-amber-500' : ''}`}
                          >
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white text-sm sm:text-base font-bold capitalize">{formatMonthYearSafe(f.mes)}</p>
                          <p className="text-[10px] text-sky-500 uppercase font-black tracking-widest mt-0.5 md:mt-2">
                            Recorrente: <span className="text-zinc-300">{formatCurrency(dynamicRecorrente)}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-emerald-400 font-black text-sm sm:text-base tabular-nums">
                          {formatCurrency(dynamicTotal)}
                        </p>
                        <p className="text-[9px] text-zinc-300 font-bold uppercase mt-0.5 md:mt-2">Total Faturado</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-zinc-800/80 animate-fadeIn">
                        {/* Card de Resumo do Mês */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3">
                            <p className="text-zinc-300 text-[9px] md:text-[10px] font-black uppercase tracking-wider">Esperado de Contratos/Projetos</p>
                            <p className="text-white font-black text-sm mt-1 md:mt-2 tabular-nums">{formatCurrency(totalEsperadoRecorrente)}</p>
                          </div>
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3">
                            <p className="text-emerald-500 text-[9px] font-black uppercase tracking-wider">Liquidado (Pago)</p>
                            <p className="text-emerald-400 font-black text-sm mt-1 tabular-nums">{formatCurrency(totalPago)}</p>
                          </div>
                          <div className={`border rounded-2xl p-3 ${totalPendente > 0 ? 'bg-red-500/5 border-red-500/10' : 'bg-zinc-950/40 border-zinc-800/80'}`}>
                            <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider ${totalPendente > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                              {totalPendente > 0 ? 'Faltante / Pendente' : 'Sem Pendências'}
                            </p>
                            <p className={`font-black text-sm mt-1 tabular-nums ${totalPendente > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                              {formatCurrency(totalPendente)}
                            </p>
                          </div>
                        </div>

                        <h4 className="text-[10px] text-sky-500 font-black uppercase tracking-widest mb-3">Detalhamento das Cobranças (Recorrente + Projetos)</h4>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1.5 no-scrollbar">
                          {detailItens.length > 0 ? (
                            detailItens.map((item, idx) => (
                              <div key={idx} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3 flex items-center justify-between hover:border-zinc-800 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.clienteId ? (
                                    <Link 
                                      href={`/clientes/${item.clienteId}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-white text-xs font-bold hover:text-amber-500 transition-colors truncate"
                                    >
                                      {item.clienteNome}
                                    </Link>
                                  ) : (
                                    <span className="text-white text-xs font-bold truncate">{item.clienteNome}</span>
                                  )}
                                  {item.isProjeto ? (
                                    <span className="text-[8px] sm:text-[9px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 truncate">
                                      Projeto: {item.projetoTitulo}
                                    </span>
                                  ) : item.contratoId ? (
                                    <span className="text-[9px] md:text-[10px] text-sky-500 font-mono">#{item.contratoId}</span>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-zinc-300 text-xs font-bold tabular-nums">
                                    {formatCurrency(item.valor)}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight ${
                                    item.status === 'pago' 
                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                      : item.status === 'atrasado'
                                      ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                      : item.status === 'pendente'
                                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                      : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                                  }`}>
                                    {item.status === 'pago' 
                                      ? 'Pago' 
                                      : item.status === 'atrasado' 
                                      ? 'Vencido' 
                                      : item.status === 'pendente'
                                      ? 'Pendente'
                                      : 'Não Gerado'}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-zinc-300 text-[10px] font-bold uppercase py-2">Sem faturamento ativo neste mês.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 border border-dashed border-zinc-800/60 rounded-3xl">
                <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Nenhum faturamento registrado para o período filtrado.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
