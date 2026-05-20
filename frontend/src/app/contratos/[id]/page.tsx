'use client'

// Página de detalhes do contrato com fluxo de versionamento.

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContratoService, type ContratoDetail } from '@/services/contrato.service'
import { FaturamentosService } from '@/services/faturamento.service'
import { getStatusFaturamento } from '@/domain/faturamento'
import { ContratoTimeline } from '@/components/ContratoTimeline'
import type { Visita } from '@/domain/visita'
import { Settings, RefreshCw, ArrowLeft, Calendar, X, Plus } from 'lucide-react'
import { EventosService, type EventoCritico } from '@/services/eventos.service'
import { displayDate } from '@/utils/date'

export default function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [data, setData] = useState<ContratoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventos, setEventos] = useState<EventoCritico[]>([])
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [paymentDate, setPaymentDate] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showAllEventos, setShowAllEventos] = useState(false)
  const [filtroData, setFiltroData] = useState<string>('')
  const [formData, setFormData] = useState({
    valorMensal: 0,
    visitas: 0,
    motivo: ''
  })

  const [adjustFormData, setAdjustFormData] = useState({
    desconto: 0
  })

  const [editFormData, setEditFormData] = useState({
    servicosContratados: '',
    observacoesGerais: '',
    incluiRelatorio: false,
    dataFim: ''
  })



  async function handleAdjustFaturamento(e: React.FormEvent) {
    e.preventDefault()
    if (!data || !data.faturamentoAtual) return
    
    setAdjusting(true)
    try {
      const atualizado = await FaturamentosService.update(data.faturamentoAtual.id, {
        desconto: adjustFormData.desconto
      })
      
      setData(prev => {
        if (!prev) return null
        const faturamentosAtualizados = prev.todosFaturamentos.map(f => 
          f.id === atualizado.id ? atualizado : f
        )
        return {
          ...prev,
          faturamentoAtual: atualizado,
          todosFaturamentos: faturamentosAtualizados
        }
      })
      
      setShowAdjustModal(false)
    } catch {
      alert('Falha ao ajustar cobrança.')
    } finally {
      setAdjusting(false)
    }
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!data || !data.faturamentoAtual) return
    
    setPaying(true)
    try {
      const atualizado = await FaturamentosService.update(data.faturamentoAtual.id, {
        pago: true,
        data_pagamento: paymentDate
      })
      
      setData(prev => {
        if (!prev) return null
        const faturamentosAtualizados = prev.todosFaturamentos.map(f => 
          f.id === atualizado.id ? atualizado : f
        )
        return {
          ...prev,
          faturamentoAtual: atualizado,
          todosFaturamentos: faturamentosAtualizados
        }
      })
      
      setShowPaymentModal(false)
    } catch {
      alert('Falha ao confirmar recebimento do faturamento.')
    } finally {
      setPaying(false)
    }
  }

  async function handlePatch(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    
    setSubmitting(true)
    try {
      const atualizado = await ContratoService.patch({
        contratoId: id,
        servicosContratados: editFormData.servicosContratados,
        observacoesGerais: editFormData.observacoesGerais,
        incluiRelatorio: editFormData.incluiRelatorio,
        dataFim: editFormData.dataFim || null
      })
      
      setData(prev => {
        if (!prev) return null
        return {
          ...prev,
          contrato: {
            ...prev.contrato,
            servicos_contratados: atualizado.servicos_contratados,
            observacoes_gerais: atualizado.observacoes_gerais,
            inclui_relatorio: atualizado.inclui_relatorio,
            data_fim: atualizado.data_fim
          }
        }
      })
      
      setShowEditModal(false)
    } catch {
      alert('Falha ao atualizar dados administrativos do contrato.')
    } finally {
      setSubmitting(false)
    }
  }

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
            setEditFormData({
              servicosContratados: res.contrato.servicos_contratados || '',
              observacoesGerais: res.contrato.observacoes_gerais || '',
              incluiRelatorio: res.contrato.inclui_relatorio || false,
              dataFim: res.contrato.data_fim ? res.contrato.data_fim.split('T')[0] : ''
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

  useEffect(() => {
    let isMounted = true
    EventosService.getByContratoId(id)
      .then(res => {
        if (isMounted) setEventos(res || [])
      })
      .catch(err => console.error('Erro ao carregar eventos:', err))
    return () => { isMounted = false }
  }, [id])

  async function handleGerarFaturamento() {
    setSubmitting(true)
    try {
      const now = new Date()
      const mesAnoCorrente = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      await FaturamentosService.create(id, mesAnoCorrente)
      
      const updated = await ContratoService.getContratoDetail(id)
      if (updated) {
        setData(updated)
      }
      alert('Faturamento da competência gerado com sucesso!')
    } catch {
      alert('Erro ao gerar faturamento.')
    } finally {
      setSubmitting(false)
    }
  }

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

  const { contrato, cliente, faturamentoAtual, todosFaturamentos, visitas, pagamentos } = data
  const now = new Date()
  const mesAnoCorrente = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const faturamentoCorrenteExiste = todosFaturamentos.some(f => f.mes_ano === mesAnoCorrente)
  const statusFat = faturamentoAtual ? getStatusFaturamento(faturamentoAtual) : null

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

  const cleanedEvidencias = contrato.evidencias
    ? contrato.evidencias
        .map(ev => cleanEvidence(ev, contrato.motivo_saude || ''))
        .filter(ev => ev.trim().length > 0)
    : []

  // Filtro por dia para o histórico de visitas
  const visitasFiltradas = filtroData
    ? visitas.filter(v => {
        if (!v.data_hora) return false
        const datePart = v.data_hora.split('T')[0]
        return datePart === filtroData
      })
    : visitas.slice(0, 10)

  return (
    <main className="min-h-screen bg-[#07090D] pb-32 text-zinc-300">
      {/* ── HEADER ── */}
      <header className="px-5 pt-8 pb-4 ">
        {/* Nav Context */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/contratos" 
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-sky-500 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={10} strokeWidth={3} />
            Voltar para contratos
          </Link>
          <StatusBadge variant={contrato.status || ''} />
        </div>

        {/* Título & Botões */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white text-xl md:text-2xl font-black tracking-tight truncate">
              {cliente.nome_instituicao}
            </h1>
            <p className="text-zinc-400 text-sm mt-4">
              Gestão de Contrato · <span className='text-sky-500'>ID #{contrato.id}</span>
            </p>
          </div>

          {contrato.status === 'ativo' && (
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 hover:text-white text-zinc-300 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-black/20"
              >
                <Settings size={11} className="stroke-[2.5]" />
                Ajustar Cadastro
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-sky-950/20"
              >
                <RefreshCw size={11} className="stroke-[2.5]" />
                Registrar Reajuste
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-5 pt-8 space-y-10">
        {/* ── SEÇÃO 1: INFO CONTRATO ── */}
        <section>
          <SectionHeader label="Contrato Permanente (Base)" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard label="Serviços" value={contrato.servicos_contratados} />
            <InfoCard 
              label="Mensalidade Base" 
              value={
                pagamentos && pagamentos.length > 0 
                  ? ContratoService.formatarPagamentos(pagamentos)
                  : contrato.valor_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              } 
              accent="green" 
            />
            <InfoCard label="Regra de Cobrança" value={contrato.visitas_previstas_mes > 0 ? 'Mensalidade + Extras por Visita' : 'Mensalidade Fixa (Perene)'} accent='blue' />
            <InfoCard label="Visitas Previstas" value={`${contrato.visitas_previstas_mes} visitas/mês`} accent='blue' />
            <InfoCard label="Relatório Técnico" value={contrato.inclui_relatorio ? 'Incluso' : 'Não incluso'} accent={contrato.inclui_relatorio ? 'blue' : 'default'} />
            <InfoCard label="Data Início" value={displayDate(contrato.data_inicio)} />
            <InfoCard label="Data Fim" value={contrato.data_fim ? displayDate(contrato.data_fim) : 'Indeterminado'} />
            {contrato.observacoes_gerais && (
              <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Observações Gerais</p>
                <p className="text-zinc-200 text-sm leading-relaxed italic">&quot;{contrato.observacoes_gerais}&quot;</p>
              </div>
            )}
          </div>
        </section>
        
        {/* ── SEÇÃO 1.5: SAÚDE OPERACIONAL ── */}
        {(contrato.perfil_pragmatico || contrato.intensidade_operacional || contrato.indice_desgaste !== undefined) && (
          <section>
            <SectionHeader label="Saúde do Relacionamento" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contrato.perfil_pragmatico && (
                <InfoCard label="Perfil Pragmático" value={contrato.perfil_pragmatico} />
              )}
              {contrato.intensidade_operacional && (
                <InfoCard label="Intensidade de Visitas" value={contrato.intensidade_operacional} />
              )}
              {contrato.indice_desgaste !== undefined && (
                <InfoCard 
                  label="Desgaste do Contrato" 
                  value={`${contrato.indice_desgaste}%`} 
                  accent={contrato.indice_desgaste > 60 ? 'red' : contrato.indice_desgaste > 30 ? 'yellow' : 'default'} 
                />
              )}
              {contrato.motivo_saude && (
                <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Diagnóstico de Saúde</p>
                  <p className="text-zinc-200 text-sm leading-relaxed italic">&quot;{contrato.motivo_saude}&quot;</p>
                  {cleanedEvidencias.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-4">
                      {cleanedEvidencias.slice(0, 3).map((e, idx) => (
                        <span key={idx} className="bg-zinc-800/60 text-zinc-300 border border-zinc-700 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 mt-3 mb-2 rounded-md">
                          • {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SEÇÃO 2: FATURAMENTO ATUAL ── */}
        <section>
          <SectionHeader label="Cobrança do Mês Atual" sub={faturamentoAtual?.mes_ano} />
          {faturamentoAtual ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Valor Total Cobrado</p>
                  <p className="text-emerald-500 text-3xl font-black tabular-nums">
                    R$&nbsp;{faturamentoAtual.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                  <button 
                    onClick={() => {
                      setAdjustFormData({
                        desconto: faturamentoAtual.desconto
                      })
                      setShowAdjustModal(true)
                    }}
                    className="flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 hover:text-white text-zinc-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all shadow-lg shadow-black/20"
                  >
                    <Settings size={11} className="stroke-[2.5]" />
                    Ajustar Cobrança
                  </button>
                  {!faturamentoAtual.pago && (
                    <button
                      onClick={() => {
                        setPaymentDate(new Date().toISOString().split('T')[0])
                        setShowPaymentModal(true)
                      }}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98]"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mr-0.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Confirmar Pagamento
                    </button>
                  )}
                  <StatusBadge variant={statusFat || 'pendente'} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 pt-6 border-t border-zinc-800/50">
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Base</p>
                  <p className="text-zinc-300 font-bold text-sm">R$&nbsp;{faturamentoAtual.valor_base.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Extras</p>
                  <p className="text-zinc-300 font-bold text-sm">R$&nbsp;{faturamentoAtual.valor_extra.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Desconto</p>
                  <p className="text-red-400/80 font-bold text-sm">- R$&nbsp;{faturamentoAtual.desconto.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Visitas Mês</p>
                  <p className="text-zinc-300 font-bold text-sm">
                    {faturamentoAtual.visitas_realizadas ?? 0}&nbsp;/&nbsp;{contrato.visitas_previstas_mes}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2">Pagamento</p>
                  <p className="text-zinc-300 font-bold text-sm">
                    {faturamentoAtual.pago ? (faturamentoAtual.data_pagamento ? displayDate(faturamentoAtual.data_pagamento) : 'Confirmado') : 'Pendente'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/30 border border-dashed border-zinc-800/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4">
              <p className="text-zinc-400 text-sm font-medium">Sem faturamento disponível para este período.</p>
              {!faturamentoCorrenteExiste && (
                <button
                  onClick={handleGerarFaturamento}
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md shadow-sky-950/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={11} className="stroke-[2.5]" />
                  Gerar Faturamento Mensal
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── SEÇÃO 2.5: HISTÓRICO DE FATURAMENTOS ── */}
        {todosFaturamentos && todosFaturamentos.filter(f => f.id !== faturamentoAtual?.id).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[11px] md:text-[12px] font-black uppercase tracking-widest text-zinc-300">Histórico de Faturamentos</h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 hover:text-white text-zinc-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
              >
                {showHistory ? 'Ocultar Histórico' : `Visualizar Histórico (${todosFaturamentos.filter(f => f.id !== faturamentoAtual?.id).length})`}
              </button>
            </div>
            
            {showHistory && (
              <div className="space-y-3 animate-fadeIn">
                {todosFaturamentos
                  .filter(f => f.id !== faturamentoAtual?.id)
                  .sort((a, b) => b.mes_ano.localeCompare(a.mes_ano))
                  .map(f => {
                    const status = getStatusFaturamento(f)
                    const statusStyles: Record<string, string> = {
                      pago: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30',
                      pendente: 'bg-amber-950/20 text-amber-400 border-amber-900/30',
                      atrasado: 'bg-rose-950/20 text-rose-400 border-rose-900/30'
                    }
                    const badgeStyle = statusStyles[status] || 'bg-zinc-800 text-zinc-500'
                    const [ano, mes] = f.mes_ano.split('-')
                    const dateObj = new Date(parseInt(ano), parseInt(mes) - 1)
                    const mesExtenso = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

                    return (
                      <div key={f.id} className="bg-zinc-900/30 border border-zinc-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-800 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-white text-sm font-bold capitalize">{mesExtenso}</p>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                              {status === 'pago' ? '✓ Pago' : status}
                            </span>
                          </div>
                          <p className="text-[10px] md:text-[11px] text-sky-300 font-bold uppercase tracking-wider">
                            Base: R$&nbsp;{f.valor_base.toLocaleString('pt-BR')}&nbsp; · 
                            Extras: R$&nbsp;{f.valor_extra.toLocaleString('pt-BR')}&nbsp;· 
                            Desconto: R$&nbsp;{f.desconto.toLocaleString('pt-BR')}&nbsp;· 
                            Visitas: {f.visitas_realizadas ?? 0}&nbsp;realizadas
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-zinc-800/30 pt-2 sm:pt-0">
                          <p className="text-white font-black text-sm tabular-nums">
                            R$&nbsp;{f.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[9px] md:text-[10px] text-zinc-300 font-medium uppercase mt-3">
                            {f.pago ? (f.data_pagamento ? `Liquidado em ${displayDate(f.data_pagamento)}` : 'Liquidado') : 'Em aberto'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </section>
        )}

        {/* ── SEÇÃO 3: EVOLUÇÃO DO CONTRATO (TIMELINE) ── */}
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

        {/* ── SEÇÃO 4: HISTÓRICO DE VISITAS ── */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 px-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-200 shrink-0">Histórico de Visitas</h2>
              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wide">
                ({filtroData ? `${visitasFiltradas.length} encontradas` : `${visitas.length} registros`})
              </span>
            </div>
            
            {/* Filtro por Dia */}
            <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-700 rounded-xl px-3 py-1.5 hover:border-zinc-600 transition-colors self-start sm:self-auto">
              <Calendar size={12} className="text-sky-500 stroke-[2.5]" />
              <input 
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-zinc-300 outline-hidden border-hidden p-0 cursor-pointer w-[105px] scheme:dark"
              />
              {filtroData && (
                <button 
                  onClick={() => setFiltroData('')}
                  className="text-red-500 hover:text-white transition-colors cursor-pointer"
                  title="Limpar filtro"
                >
                  <X size={14} className="stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {visitasFiltradas.length > 0 ? (
              visitasFiltradas.map(v => <VisitaCard key={v.id} v={v} />)
            ) : (
              <EmptyState message={filtroData ? `Nenhuma visita registrada para a data ${displayDate(filtroData)}.` : "Nenhuma visita registrada para este contrato."} />
            )}
          </div>
        </section>

        {/* ── SEÇÃO 4.5: EVENTOS CRÍTICOS (CRISES) ── */}
        {eventos.length > 0 && (
          <section id="eventos-criticos" className="mt-8 pt-6 border-t border-zinc-900/60">
            <div className="flex items-baseline gap-2 mb-4 px-1">
              <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-300">Eventos Críticos Registrados</h2>
              <span className="text-[10px] md:text-[11px] font-bold text-rose-500 uppercase tracking-wide">
                ({eventos.length})
              </span>
            </div>
            <div className="space-y-3">
              {(showAllEventos ? eventos : eventos.slice(0, 3)).map(ev => {
                const cardContent = (
                  <div className="flex items-start gap-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 hover:bg-rose-950/35 transition-colors">
                    <span className="size-1.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center justify-between gap-4 mb-1 md:mb-2">
                        <span className="text-[10px] md:text-[11px] font-bold text-rose-400 uppercase tracking-wider">Crise</span>
                        <span className="text-[10px] md:text-[11px] text-zinc-400">{displayDate(ev.data_evento)}</span>
                      </div>
                      <p className="text-zinc-200 leading-relaxed">{ev.descricao}</p>
                      {ev.acao_tomada && (
                        <p className="mt-1.5 text-sky-400/90 italic pl-2 border-l border-zinc-800 text-[11px] leading-snug">
                          Ação: {ev.acao_tomada}
                        </p>
                      )}
                    </div>
                  </div>
                )

                if (ev.id_visita) {
                  return (
                    <Link
                      key={ev.id_evento}
                      href={`/visitas/${ev.id_visita}`}
                      className="block hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                    >
                      {cardContent}
                    </Link>
                  )
                }

                return (
                  <div key={ev.id_evento}>
                    {cardContent}
                  </div>
                )
              })}
              {eventos.length > 3 && (
                <button
                  onClick={() => setShowAllEventos(!showAllEventos)}
                  className="text-zinc-500 hover:text-zinc-300 text-[9px] uppercase font-black tracking-widest pl-2 mt-1 transition-colors cursor-pointer block w-full text-left"
                >
                  {showAllEventos ? "- Ocultar crises adicionais" : `+ ${eventos.length - 3} crises registradas no histórico`}
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── MODAL DE ATUALIZAÇÃO ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative bg-[#0d1117] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white text-lg font-black tracking-tight">Registrar Reajuste Contratual</h2>
              <p className="text-zinc-300 text-xs mt-3 leading-relaxed">
                <span className="text-sky-400 font-bold">Gera uma nova versão na timeline.</span> Encerra a versão atual e atualiza os valores financeiros.
              </p>
            </div>
            
            <form onSubmit={handleReplace} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Novo Valor Mensal (R$)</label>
                <input 
                  type="number" 
                  required
                  value={formData.valorMensal}
                  onChange={e => setFormData({...formData, valorMensal: Number(e.target.value)})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Visitas Previstas / Mês</label>
                <input 
                  type="number" 
                  required
                  value={formData.visitas}
                  onChange={e => setFormData({...formData, visitas: Number(e.target.value)})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Motivo da Alteração (Histórico)</label>
                <textarea 
                  required
                  placeholder="Ex: Reajuste anual pelo IPCA, expansão da carga horária"
                  value={formData.motivo}
                  onChange={e => setFormData({...formData, motivo: e.target.value})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 text-sm focus:outline-hidden focus:border-sky-500 transition-colors min-h-[80px]"
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
                  {submitting ? 'Gravando...' : 'Gravar Nova Versão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDIÇÃO COSMÉTICA ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !submitting && setShowEditModal(false)} />
          <div className="relative bg-[#0d1117] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white text-lg font-black tracking-tight">Ajustar Cadastro Administrativo</h2>
              <p className="text-zinc-300 text-xs mt-3 leading-relaxed">
                Edição simples de escopo e vigência. <span className="text-amber-500 font-medium">NÃO altera o faturamento nem gera uma nova versão.</span>
              </p>
            </div>
            
            <form onSubmit={handlePatch} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Serviços Contratados</label>
                <textarea 
                  required
                  value={editFormData.servicosContratados}
                  onChange={e => setEditFormData({...editFormData, servicosContratados: e.target.value})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Vigência Final (Opcional)</label>
                  <input 
                    type="date"
                    value={editFormData.dataFim}
                    onChange={e => setEditFormData({...editFormData, dataFim: e.target.value})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <p className="text-sky-500 text-[10px] md:text-[12px] mt-2 leading-normal">
                    Deixe em branco para prazo indeterminado.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Relatório Mensal</label>
                <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                  <input
                    type="checkbox"
                    id="edit-contract-report"
                    className="w-4 h-4 rounded border-zinc-800 text-sky-500 bg-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    checked={editFormData.incluiRelatorio}
                    onChange={e => setEditFormData({ ...editFormData, incluiRelatorio: e.target.checked })}
                  />
                  <label htmlFor="edit-contract-report" className="text-xs text-zinc-300 font-bold select-none cursor-pointer">
                    Exigir relatório técnico mensal
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Observações Gerais</label>
                <textarea 
                  value={editFormData.observacoesGerais}
                  onChange={e => setEditFormData({...editFormData, observacoesGerais: e.target.value})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 text-sm focus:outline-none focus:border-sky-500 transition-colors min-h-[80px] resize-none"
                  placeholder="Ex: Particularidades sobre faturamentos ou cronogramas de visitas"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Gravando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO DE RECEBIMENTO ── */}
      {showPaymentModal && data?.faturamentoAtual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !paying && setShowPaymentModal(false)} />
          <div className="relative bg-[#0d1117] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white text-lg font-black tracking-tight">Confirmar Recebimento</h2>
              <p className="text-zinc-300 text-xs mt-3 leading-relaxed">
                Confirme que o pagamento de <span className="text-emerald-400 font-bold">R$&nbsp;{data.faturamentoAtual.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> foi recebido e dê baixa no faturamento.
              </p>
            </div>
            
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">Data do Pagamento</label>
                <input 
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-sky-500 text-[10px] md:text-[12px] mt-2 leading-normal">
                  Informe a data em que o valor foi creditado.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  disabled={paying}
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={paying}
                  className="flex-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? 'Processando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE AJUSTE DE COBRANÇA (FECHAMENTO DO MÊS) ── */}
      {showAdjustModal && data?.faturamentoAtual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !adjusting && setShowAdjustModal(false)} />
          <div className="relative bg-[#0d1117] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
              <h2 className="text-white text-lg font-black tracking-tight">Ajustar Cobrança do Mês</h2>
              <p className="text-zinc-300 text-xs md:text-[12px] mt-4 leading-relaxed">
                Ajuste temporário de descontos para o fechamento da cobrança do mês de <span className="text-sky-400 font-bold">{data.faturamentoAtual.mes_ano}</span>. <span className="text-amber-500 font-medium">NÃO altera o contrato permanente.</span>
              </p>
            </div>
            
            <form onSubmit={handleAdjustFaturamento} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-2">Base Contratado</p>
                  <p className="text-zinc-200 font-bold text-sm">R$&nbsp;{data.faturamentoAtual.valor_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-2">Extras Calculados</p>
                  <p className="text-zinc-200 font-bold text-sm">R$&nbsp;{data.faturamentoAtual.valor_extra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-2">Desconto do Mês (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={adjustFormData.desconto}
                  onChange={e => setAdjustFormData({...adjustFormData, desconto: parseFloat(e.target.value) || 0})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
                <p className="text-sky-500 text-[10px] md:text-[12px] mt-1.5 leading-normal">
                  Insira o valor do desconto a ser aplicado nesta fatura mensal.
                </p>
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-2">Valor Final Derivado</label>
                <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 flex justify-between items-center">
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Total Cobrado</p>
                  <p className="text-white text-lg font-black tabular-nums">
                    R$&nbsp;{(Math.max(0, data.faturamentoAtual.valor_base + data.faturamentoAtual.valor_extra - adjustFormData.desconto)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  disabled={adjusting}
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adjusting ? 'Salvando...' : 'Confirmar Ajustes'}
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
      <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-200 shrink-0">{label}</h2>
      {(sub || count !== undefined) && (
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">
          {sub || `${count} registros`}
        </span>
      )}
    </div>
  )
}

function InfoCard({ label, value, accent }: { label: string; value: string | number; accent?: 'blue' | 'green' | 'red' | 'yellow' | 'default' }) {
  const colorClass = 
    accent === 'blue' ? 'text-sky-400' : 
    accent === 'green' ? 'text-emerald-400/90' : 
    accent === 'red' ? 'text-rose-400/90' : 
    accent === 'yellow' ? 'text-amber-400/90' : 
    'text-zinc-200'
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
      <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3">{label}</p>
      <p className={`text-sm font-bold wrap-break-word leading-relaxed ${colorClass}`}>{value}</p>
    </div>
  )
}

function VisitaCard({ v }: { v: Visita }) {
  return (
    <Link 
      href={`/visitas/${v.id}`}
      className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between group hover:border-sky-700 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="bg-zinc-800 rounded-xl p-2 group-hover:bg-zinc-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-bold">{new Date(v.data_hora).toLocaleDateString('pt-BR')}</p>
          <p className="text-[10px] text-sky-500 uppercase font-bold tracking-widest mt-1">
            {v.tipo_visita} · {v.status}
          </p>
        </div>
      </div>
      <svg className="text-zinc-700 group-hover:text-sky-500 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
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
