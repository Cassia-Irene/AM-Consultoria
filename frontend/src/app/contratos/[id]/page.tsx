'use client'
// app/contratos/[id]/page.tsx
//
// Página de detalhes do contrato com fluxo de versionamento.
// Estética Premium Dark/Glass alinhada ao Dashboard.

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContratoService, type ContratoDetail } from '@/services/contrato.service'
import { getStatusFaturamento } from '@/domain/faturamento'
import { ContratoTimeline } from '@/components/ContratoTimeline'
import type { Visita } from '@/domain/visita'

export default function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [data, setData] = useState<ContratoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    valorMensal: 0,
    visitas: 0,
    motivo: ''
  })

  useEffect(() => {
    let isMounted = true
    ContratoService.getContratoDetail(id)
      .then(res => {
        if (isMounted) {
          if (res) {
            setData(res)
            setFormData({
              valorMensal: res.faturamentoAtual?.valor_base || 0,
              visitas: res.contrato.visitas_previstas_mes,
              motivo: ''
            })
          } else {
            setError('Contrato não encontrado.')
          }
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Erro ao carregar detalhes do contrato.')
          setLoading(false)
        }
      })
    return () => { isMounted = false }
  }, [id])

  async function handleReplace(e: React.FormEvent) {
    e.preventDefault()
    if (!data || !formData.motivo) return
    
    setSubmitting(true)
    try {
      const novo = await ContratoService.replace({
        contratoId: id,
        novoValorMensal: formData.valorMensal,
        visitas: formData.visitas,
        motivo: formData.motivo
      })
      
      // Sucesso: Redireciona para a nova versão
      setShowModal(false)
      router.push(`/contratos/${novo.id}`)
    } catch {
      alert('Falha ao atualizar contrato. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error || !data) return <ErrorState message={error || 'Dados indisponíveis'} />

  const { contrato, cliente, faturamentoAtual, visitas } = data
  const statusFat = faturamentoAtual ? getStatusFaturamento(faturamentoAtual) : null

  return (
    <main className="min-h-screen bg-[#07090D] pb-32 text-zinc-300">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-[#07090D]/95 backdrop-blur-sm px-5 pt-10 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/contratos" className="text-zinc-500 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-xl font-black tracking-tight truncate">{cliente.nome_instituicao}</h1>
                <StatusBadge variant={contrato.status || ''} />
              </div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                Gestão de Contrato · Versão {contrato.id}
              </p>
            </div>
          </div>

          {contrato.status === 'ativo' && (
            <button 
              onClick={() => setShowModal(true)}
              className="shrink-0 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-sky-950/20"
            >
              Atualizar
            </button>
          )}
        </div>
      </header>

      <div className="px-5 pt-8 space-y-10">
        {/* ── SEÇÃO 1: INFO CONTRATO ── */}
        <section>
          <SectionHeader label="Informações Contratuais" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard label="Serviços" value={contrato.servicos_contratados} />
            <InfoCard label="Visitas Previstas" value={`${contrato.visitas_previstas_mes} visitas/mês`} />
            <InfoCard label="Relatório Técnico" value={contrato.inclui_relatorio ? 'Incluso' : 'Não incluso'} accent={contrato.inclui_relatorio ? 'blue' : 'default'} />
            <InfoCard label="Data Início" value={new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} />
            <InfoCard label="Data Fim" value={contrato.data_fim ? new Date(contrato.data_fim).toLocaleDateString('pt-BR') : 'Indeterminado'} />
            {contrato.observacoes_gerais && (
              <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Observações Gerais</p>
                <p className="text-zinc-400 text-sm leading-relaxed italic">&quot;{contrato.observacoes_gerais}&quot;</p>
              </div>
            )}
          </div>
        </section>

        {/* ── SEÇÃO 2: FATURAMENTO ATUAL ── */}
        <section>
          <SectionHeader label="Faturamento do Mês" sub={faturamentoAtual?.mes_ano} />
          {faturamentoAtual ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Valor Total</p>
                  <p className="text-white text-3xl font-black tabular-nums">
                    R$&nbsp;{faturamentoAtual.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <StatusBadge variant={statusFat || 'pendente'} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-zinc-800/50">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Base</p>
                  <p className="text-zinc-300 font-bold text-sm">R$&nbsp;{faturamentoAtual.valor_base.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Extras</p>
                  <p className="text-zinc-300 font-bold text-sm">R$&nbsp;{faturamentoAtual.valor_extra.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Desconto</p>
                  <p className="text-red-400/80 font-bold text-sm">- R$&nbsp;{faturamentoAtual.desconto.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Pagamento</p>
                  <p className="text-zinc-300 font-bold text-sm">
                    {faturamentoAtual.pago ? (faturamentoAtual.data_pagamento ? new Date(faturamentoAtual.data_pagamento).toLocaleDateString('pt-BR') : 'Confirmado') : 'Pendente'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="Sem faturamento disponível para este período." />
          )}
        </section>

        {/* ── SEÇÃO 3: HISTÓRICO DE VISITAS ── */}
        <section>
          <SectionHeader label="Histórico de Visitas" count={visitas.length} />
          <div className="space-y-3">
            {visitas.length > 0 ? (
              visitas.map(v => <VisitaCard key={v.id} v={v} />)
            ) : (
              <EmptyState message="Nenhuma visita registrada para este contrato." />
            )}
          </div>
        </section>

        {/* ── SEÇÃO 4: EVOLUÇÃO DO CONTRATO (TIMELINE) ── */}
        <section>
          <SectionHeader label="Evolução do Contrato" />
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8">
            <ContratoTimeline 
              contratos={data.todosContratos}
              historicos={data.historicos}
              contratoId={id}
            />
          </div>
        </section>
      </div>

      {/* ── MODAL DE ATUALIZAÇÃO ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-[#0d1117] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white text-lg font-black tracking-tight">Atualizar Contrato</h2>
              <p className="text-zinc-500 text-xs mt-1">Gera uma nova versão e encerra a atual.</p>
            </div>
            
            <form onSubmit={handleReplace} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Novo Valor Mensal (R$)</label>
                <input 
                  type="number" 
                  required
                  value={formData.valorMensal}
                  onChange={e => setFormData({...formData, valorMensal: Number(e.target.value)})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Visitas Previstas / Mês</label>
                <input 
                  type="number" 
                  required
                  value={formData.visitas}
                  onChange={e => setFormData({...formData, visitas: Number(e.target.value)})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Motivo da Alteração</label>
                <textarea 
                  required
                  placeholder="Ex: Reajuste anual ou expansão de escopo"
                  value={formData.motivo}
                  onChange={e => setFormData({...formData, motivo: e.target.value})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-sky-500 transition-colors min-h-[100px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

/* ── COMPONENTES INTERNOS ── */

function SectionHeader({ label, sub, count }: { label: string; sub?: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-4 px-1">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{label}</h2>
      {(sub || count !== undefined) && (
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">
          {sub || `${count} registros`}
        </span>
      )}
    </div>
  )
}

function InfoCard({ label, value, accent }: { label: string; value: string | number; accent?: 'blue' | 'default' }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className={`text-sm font-bold truncate ${accent === 'blue' ? 'text-sky-400' : 'text-zinc-200'}`}>{value}</p>
    </div>
  )
}

function VisitaCard({ v }: { v: Visita }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between group hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-zinc-800 rounded-xl p-2 group-hover:bg-zinc-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-bold">{new Date(v.data_hora).toLocaleDateString('pt-BR')}</p>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
            {v.tipo_visita} · {v.status}
          </p>
        </div>
      </div>
      <svg className="text-zinc-700 group-hover:text-sky-500 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  )
}


function StatusBadge({ variant }: { variant: string }) {
  const styles: Record<string, string> = {
    ativo:     'bg-emerald-900/40 text-emerald-400 border-emerald-800/30',
    inativo:   'bg-zinc-800 text-zinc-500 border-zinc-700/30',
    suspenso:  'bg-red-900/40 text-red-400 border-red-800/30',
    pago:      'bg-emerald-900/40 text-emerald-400 border-emerald-800/30',
    pendente:  'bg-amber-900/40 text-amber-400 border-amber-800/30',
    atrasado:  'bg-red-900/40 text-red-400 border-red-800/30',
  }
  const style = styles[variant] || 'bg-zinc-800 text-zinc-500'
  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${style} uppercase tracking-widest`}>
      {variant === 'pago' ? '✓ Pago' : variant}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#07090D] px-5 pt-10">
      <div className="h-6 w-48 bg-zinc-900 rounded animate-pulse mb-8" />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-zinc-900/50 rounded-2xl animate-pulse" />
          <div className="h-20 bg-zinc-900/50 rounded-2xl animate-pulse" />
        </div>
        <div className="h-44 bg-zinc-900/50 rounded-3xl animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900/50 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </main>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center px-10 text-center">
      <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-8 max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-white font-bold text-lg mb-2">Ops! Algo deu errado</h2>
        <p className="text-zinc-500 text-sm mb-6">{message}</p>
        <Link href="/contratos" className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors">
          Voltar para Contratos
        </Link>
      </div>
    </main>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl py-8 text-center">
      <p className="text-zinc-600 text-xs italic font-medium">{message}</p>
    </div>
  )
}
