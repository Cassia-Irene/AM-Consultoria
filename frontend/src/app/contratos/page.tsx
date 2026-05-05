'use client'
// app/contratos/page.tsx
//
// Refatoração estrutural completa para alinhar com o novo mapa lógico.
// Focado em registro contratual puro, sem lógica financeira (agora em FaturamentoCliente).

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getClientes } from '@/mappers/cliente.mapper'
import { getContratos } from '@/mappers/contrato.mapper'
import { getFaturamentos } from '@/mappers/faturamento.mapper'
import { getFaturamentoMaisRecente } from '@/domain/faturamento'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'
import type { Cliente } from '@/domain/cliente'
import { fetchApi } from '@/services/api'

type ContratoComCliente = Contrato & { clienteNome: string }

export default function ContratosPage() {
  const [contratos, setContratos] = useState<ContratoComCliente[]>([])
  const [faturamentos, setFaturamentos] = useState<FaturamentoCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [todosContratos, clientes, fatDados] = await Promise.all([
          fetchApi<Contrato[]>('/contratos', undefined, getContratos()),
          fetchApi<Cliente[]>('/clientes', undefined, getClientes()),
          fetchApi<FaturamentoCliente[]>('/faturamento-cliente', undefined, getFaturamentos())
        ])

        const clienteNomePorId = new Map(clientes.map(c => [c.id, c.nome_instituicao]))

        const comNome: ContratoComCliente[] = todosContratos.map(c => ({
          ...c,
          clienteNome: clienteNomePorId.get(c.clienteId) ?? `Cliente ${c.clienteId}`,
        }))

        if (isMounted) {
          setContratos(comNome)
          setFaturamentos(fatDados)
        }
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

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-32 text-zinc-300">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-[#07090D]/95 backdrop-blur-sm px-5 pt-10 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-4 mb-1">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-white text-xl font-black tracking-tight">Contratos</h1>
        </div>
        <div className="flex items-center justify-between ml-10">
          <p className="text-zinc-500 text-xs font-medium">Gestão e acompanhamento operacional</p>
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{hoje}</p>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-8">
        {/* ── ERROR ALERT ── */}
        {error && (
          <div className="bg-red-950/40 border border-red-700/50 rounded-2xl px-4 py-3 text-red-400 text-sm">
            <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Aviso</p>
            {error}
          </div>
        )}

        {/* ── GRID DE CARDS ── */}
        {contratos.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contratos.map(contrato => (
              <ContratoCard 
                key={contrato.id} 
                contrato={contrato} 
                faturamento={getFaturamentoMaisRecente(faturamentos, contrato.id)} 
              />
            ))}
          </section>
        ) : (
          <div className="py-20 text-center">
            <p className="text-zinc-600 text-sm font-medium italic">Nenhum contrato encontrado</p>
          </div>
        )}
      </div>
    </main>
  )
}

function ContratoCard({ contrato, faturamento }: { contrato: ContratoComCliente; faturamento?: FaturamentoCliente }) {
  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('pt-BR') : 'Indeterminado'

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all group active:scale-[0.99] flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="flex justify-between items-start mb-6 gap-3">
          <div className="min-w-0">
            <h3 className="text-white font-bold text-xl leading-tight truncate group-hover:text-sky-400 transition-colors">
              {contrato.clienteNome}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Serviços:</span>
              <p className="text-zinc-400 text-xs font-medium truncate">
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

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Visitas Mensais</p>
            <p className="text-white font-black tabular-nums text-lg">
              {contrato.visitas_previstas_mes} <span className="text-zinc-600 text-xs font-bold tracking-normal">visitas</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Vigência</p>
            <p className="text-zinc-300 text-sm font-bold tabular-nums">
              {formatDate(contrato.data_inicio)}
            </p>
            <p className="text-zinc-600 text-[10px] font-medium mt-0.5">
              até {formatDate(contrato.data_fim)}
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Faturamento:</p>
          {faturamento ? (
            <StatusBadgeLocal variant={faturamento.status} />
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-600 px-2 py-0.5 rounded-lg">
              Sem dados
            </span>
          )}
        </div>
        
        <button className="text-[11px] font-black uppercase tracking-widest text-sky-500 flex items-center gap-1 group/btn">
          Ver detalhes
          <svg className="group-hover/btn:translate-x-0.5 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
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