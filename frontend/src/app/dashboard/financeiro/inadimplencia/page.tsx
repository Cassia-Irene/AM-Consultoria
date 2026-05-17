'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaturamentosService } from '@/services/faturamento.service'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { getStatusFaturamento, type FaturamentoCliente } from '@/domain/faturamento'
import { OperationalTabs, type TabOption } from '@/components/OperationalTabs'

type FiltroStatus = 'todas' | 'pendentes' | 'vencidas' | 'pagas'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

function formatMesAno(mesAno: string) {
  const [ano, mes] = mesAno.split('-')
  const date = new Date(parseInt(ano), parseInt(mes) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function InadimplenciaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [rawItems, setRawItems] = useState<{
    faturamento: FaturamentoCliente
    cliente: string
    clienteId: string
    contratoId: string
    diasAtraso: number
    statusOperacional: FiltroStatus
  }[]>([])

  const filtro = (searchParams.get('status') as FiltroStatus) || 'todas'

  const setFiltro = (newStatus: FiltroStatus) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newStatus === 'todas') params.delete('status')
    else params.set('status', newStatus)
    router.replace(`/dashboard/financeiro/inadimplencia?${params.toString()}`)
  }

  useEffect(() => {
    async function load() {
      try {
        const [faturamentos, clientes, contratos] = await Promise.all([
          FaturamentosService.getAll(),
          ClientesService.getAll(),
          ContratoService.getAll()
        ])

        const mapped = faturamentos.map(f => {
          const contrato = contratos.find(c => c.id === f.contratoId)
          const cliente = clientes.find(c => c.id === contrato?.clienteId)
          
          const statusF = getStatusFaturamento(f)
          let statusOperacional: FiltroStatus = 'pendentes'
          if (f.pago) statusOperacional = 'pagas'
          else if (statusF === 'atrasado') statusOperacional = 'vencidas'

          // Cálculo de atraso
          const [ano, mes] = f.mes_ano.split('-').map(Number)
          const vencimento = new Date(ano, mes - 1, 10)
          const hoje = new Date()
          const diffTime = hoje.getTime() - vencimento.getTime()
          const diasAtraso = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

          return {
            faturamento: f,
            cliente: cliente?.nome_instituicao ?? 'Cliente não identificado',
            clienteId: cliente?.id ?? '',
            contratoId: f.contratoId,
            diasAtraso,
            statusOperacional
          }
        })

        setRawItems(mapped)
      } catch (err) {
        console.error('Erro ao carregar inadimplência:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredItems = useMemo(() => {
    if (filtro === 'todas') return rawItems
    return rawItems.filter(item => item.statusOperacional === filtro)
  }, [rawItems, filtro])

  const tabOptions: TabOption<FiltroStatus>[] = [
    { value: 'todas', label: 'Todas', count: rawItems.length },
    { value: 'pendentes', label: 'Pendentes', count: rawItems.filter(i => i.statusOperacional === 'pendentes').length },
    { value: 'vencidas', label: 'Vencidas', count: rawItems.filter(i => i.statusOperacional === 'vencidas').length },
    { value: 'pagas', label: 'Pagas', count: rawItems.filter(i => i.statusOperacional === 'pagas').length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-amber-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Rastreando Recebíveis...</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <header className="px-5 pt-8 pb-4 flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="size-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-white text-2xl font-black tracking-tight truncate">Inadimplência</h1>
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest truncate">Ações Financeiras Necessárias</p>
        </div>
      </header>

      <div className="px-5 mb-2">
        <OperationalTabs 
          options={tabOptions} 
          currentValue={filtro} 
          onChange={setFiltro} 
        />
      </div>

      <div className="px-5 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
            <p className="text-zinc-800 text-[10px] mt-1 uppercase">Tente alterar o filtro</p>
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 hover:border-amber-900/40 transition-colors group">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full shrink-0 ${item.statusOperacional === 'pagas' ? 'bg-emerald-500' : item.statusOperacional === 'vencidas' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <h2 className="text-white font-black text-base sm:text-lg group-hover:text-amber-400 transition-colors truncate">{item.cliente}</h2>
                </div>
                <p className="text-zinc-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
                  Contrato #{item.contratoId} · <span className="text-zinc-300 capitalize">{formatMesAno(item.faturamento.mes_ano)}</span>
                </p>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-6 border-t lg:border-t-0 border-zinc-800/40 pt-4 lg:pt-0">
                <div className="text-left lg:text-right min-w-[80px]">
                  <p className={`text-lg sm:text-xl font-black tabular-nums ${item.statusOperacional === 'pagas' ? 'text-emerald-500' : item.statusOperacional === 'vencidas' ? 'text-red-500' : 'text-zinc-300'}`}>
                    {formatCurrency(item.faturamento.valor_total)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none">
                    {item.statusOperacional === 'pagas' ? 'Liquidado' : 'A Receber'}
                  </p>
                </div>
                
                {item.statusOperacional === 'vencidas' && (
                  <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center min-w-[60px] sm:min-w-[70px]">
                    <p className="text-red-500 text-sm sm:text-base font-black tabular-nums">{item.diasAtraso}d</p>
                    <p className="text-[8px] text-red-500/60 font-black uppercase tracking-tighter">Atraso</p>
                  </div>
                )}

                <Link 
                  href={`/clientes/${item.clienteId}`} 
                  className="size-10 sm:size-12 bg-amber-500 hover:bg-amber-400 text-black rounded-full flex items-center justify-center shadow-lg shadow-amber-900/20 transition-all active:scale-90 shrink-0 ml-auto lg:ml-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {filtro === 'vencidas' && filteredItems.length > 0 && (
        <div className="mt-12 px-5">
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
            <h3 className="text-red-500 text-xs font-black uppercase tracking-widest mb-2">Impacto no Caixa</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Existem <span className="text-white font-bold">{filteredItems.length} faturamentos</span> vencidos. 
              O impacto total é de <span className="text-white font-bold">{formatCurrency(filteredItems.reduce((acc, curr) => acc + curr.faturamento.valor_total, 0))}</span>.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

export default function InadimplenciaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <span className="text-amber-500 animate-pulse font-black tracking-widest text-xs uppercase text-center">Rastreando Recebíveis...</span>
      </div>
    }>
      <InadimplenciaContent />
    </Suspense>
  )
}

