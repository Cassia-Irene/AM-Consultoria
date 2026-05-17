'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ProjetosService } from '@/services/projetos.service'
import { formatCurrency } from '@/utils/finance'
import { displayDate } from '@/utils/date'
import type { Projeto } from '@/domain/projeto'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { EntregaManager } from '@/components/EntregaManager'
import { ProjectMarcoList } from '@/components/ProjectMarcoList'
import { ProjectOperationalOverrides } from '@/components/ProjectOperationalOverrides'
import { ProjectTimeline } from '@/components/ProjectTimeline'
import { ArrowLeft, ArrowUpRight, Zap, FileText, AlertCircle, DollarSign, Package, Edit3, CheckCircle2, History, TrendingUp, Plus, Target } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjetoDetalhePage({ params }: PageProps) {
  const { id } = use(params)
  
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedItem, setSelectedItem] = useState<{ 
    type: string; 
    id?: number | string;
    projetoId?: number | string;
  } | null>(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const foundProjeto = await ProjetosService.getById(id)

      if (!foundProjeto) {
        setError('Projeto não encontrado.')
        return
      }

      setProjeto(foundProjeto)
    } catch (err) {
      console.error('[ERROR][PROJETO_DETAIL]', err)
      setError('Erro ao carregar detalhes do projeto.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // Evita cascading renders síncronos
    Promise.resolve().then(() => loadData())
  }, [loadData, refreshSignal])


  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingFactual, setIsEditingFactual] = useState(false)
  const [fTitle, setFTitle] = useState('')
  const [fValor, setFValor] = useState(0)
  const [fStatus, setFStatus] = useState('')
  const [fInicio, setFInicio] = useState('')
  const [fFim, setFFim] = useState('')
  // M8 — estado antes dos early returns (Rules of Hooks)
  const [showAllParcelas, setShowAllParcelas] = useState(false)

  useEffect(() => {
    if (projeto) {
      Promise.resolve().then(() => {
        setFTitle(projeto.titulo)
        setFValor(projeto.valor_total)
        setFStatus(projeto.status)
        setFInicio(projeto.data_inicio)
        setFFim(projeto.data_fim_prevista || '')
      })
    }
  }, [projeto])

  const handleTitleSave = async () => {
    if (!projeto) return
    try {
      await ProjetosService.update(id, { titulo: fTitle })
      setRefreshSignal(prev => prev + 1)
      setIsEditingTitle(false)
    } catch (err) {
      console.error('Erro ao atualizar título:', err)
    }
  }

  const handleFactualSave = async () => {
    if (!projeto) return
    try {
      await ProjetosService.update(id, {
        valor_total: fValor,
        status: fStatus,
        data_inicio: fInicio,
        data_fim_prevista: fFim || null
      })
      setRefreshSignal(prev => prev + 1)
      setIsEditingFactual(false)
    } catch (err) {
      console.error('Erro ao atualizar dados fatuais:', err)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error || !projeto) return <ErrorState message={error || 'Projeto inexistente'} />

  // Operação Factual Consolidada (Single Payload)
  const entregas = projeto.entregas || []
  const parcelas = projeto.parcelas || []
  const extras = projeto.extras || []
  const pendencias = projeto.pendencias || []
  const eventos = projeto.eventos || []

  const tensionLevel = projeto.nivel_tensao || 'Baixa'
  const tensionColor = tensionLevel === 'Crítica' ? 'text-rose-500' : tensionLevel === 'Moderada' ? 'text-amber-500' : 'text-emerald-500'
  const lateCount = projeto.count_atrasos || 0

  const nextDelivery = entregas
    .filter(e => !e.entregue && new Date(e.data_entrega_prevista) >= new Date())
    .sort((a, b) => new Date(a.data_entrega_prevista).getTime() - new Date(b.data_entrega_prevista).getTime())[0]
  
  const progressPercent = projeto.percentual_conclusao || 0

  // M5 — carga operacional: derivada de dados já disponíveis
  const pendenciasAbertas = pendencias.filter((p: { resolvida?: boolean }) => !p.resolvida).length
  const scoreDesgaste = (extras.length * 1.5) + (pendenciasAbertas * 0.5) - (progressPercent * 0.05)
  const cargaElevada = scoreDesgaste > 5

  // M8 — fluxo financeiro focado
  const parcelasOrdenadas = [...parcelas].sort(
    (a, b) => new Date(a.data_pagamento_prevista).getTime() - new Date(b.data_pagamento_prevista).getTime()
  )
  const parcelasVisiveis = showAllParcelas
    ? parcelasOrdenadas
    : [
        ...parcelasOrdenadas.filter(p => p.pago).slice(-2),
        ...parcelasOrdenadas.filter(p => !p.pago).slice(0, 3)
      ].sort((a, b) => new Date(a.data_pagamento_prevista).getTime() - new Date(b.data_pagamento_prevista).getTime())
  const parcelasOcultas = parcelas.length - parcelasVisiveis.length

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32 overflow-x-hidden">

      <header className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">

        {/* Nav Context */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/projetos" 
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-sky-500 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={10} strokeWidth={3} />
            Voltar para projetos
          </Link>
          <div className="flex items-center gap-3">
             {(projeto.isExtra || extras.length > 0) && (
                <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border border-amber-500/20">
                   Projeto Extra
                </span>
             )}
             {cargaElevada && (
               <span
                 title={`Carga elevada: ${extras.length} extra(s), ${pendenciasAbertas} pendência(s) em aberto`}
                 className="text-[9px] font-black text-zinc-600 cursor-help select-none"
               >
                 ⚡
               </span>
             )}
             <StatusBadge status={projeto.status} />
          </div>
        </div>

        {/* Título */}
        <div className="mb-5">
          {isEditingTitle ? (
            <input autoFocus value={fTitle} onChange={(e) => setFTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="bg-zinc-900 border border-sky-500/50 text-white text-2xl sm:text-3xl font-black tracking-tight px-4 py-2 rounded-2xl w-full max-w-2xl focus:outline-none" />
          ) : (
            <h1 onClick={() => setIsEditingTitle(true)} className="text-white text-2xl sm:text-3xl font-black tracking-tight cursor-pointer hover:text-sky-400 transition-colors group inline-flex items-center gap-3">
              {projeto.titulo}
              <Edit3 size={16} className="opacity-60 group-hover:opacity-100 transition-all" />
            </h1>
          )}
        </div>

        {/* ── SINAIS VITAIS ── */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-6 py-5 px-8 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl mb-8">
           
           {/* Avanço */}
           <div className="flex flex-col gap-1.5 min-w-[140px]">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">Avanço Factual</span>
             <div className="flex items-center gap-3">
               <span className="text-white text-3xl font-black tabular-nums leading-none">{progressPercent}%</span>
               <div className="hidden sm:flex flex-col gap-1">
                 <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-sky-500 transition-all" style={{ width: `${progressPercent}%` }} />
                 </div>
                 <span className="text-sky-500 text-[9px] font-bold tracking-widest uppercase">
                   {entregas.filter(e => e.entregue).length}/{entregas.length} marcos
                 </span>
               </div>
             </div>
           </div>
           
           <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

           {/* Tensão */}
           <div className="flex flex-col gap-1.5">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">Tensão</span>
             <div className="flex items-center gap-2">
               <Zap size={18} className={tensionColor} />
               <span className={`text-lg font-black uppercase tracking-widest ${tensionColor}`}>{tensionLevel}</span>
             </div>
           </div>

           <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

           {/* Backlog */}
           <div className="flex flex-col gap-1.5">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">Atrasos Ativos</span>
             {lateCount > 0 ? (
               <div className="flex items-center gap-2">
                 <AlertCircle size={18} className="text-rose-500" />
                 <span className="text-rose-500 text-xl font-black tabular-nums leading-none">{lateCount}</span>
                 {projeto.backlog_meta && projeto.backlog_meta.aging_medio > 0 && (
                   <span className="text-rose-600 text-[10px] font-bold uppercase tracking-widest ml-1">{projeto.backlog_meta.aging_medio}d parado</span>
                 )}
               </div>
             ) : (
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={18} className="text-emerald-500/50" />
                 <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Zero</span>
               </div>
             )}
           </div>

           <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

           {/* Próximo Marco / Estagnação */}
           <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
             <span className={`text-[10px] font-black uppercase tracking-widest ${projeto.is_estagnado ? 'text-rose-500' : 'text-sky-500'}`}>

               {projeto.is_estagnado ? 'Atenção Crítica' : 'Próximo Foco'}
             </span>
             {projeto.is_estagnado ? (
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-500 text-sm font-black uppercase tracking-widest">Operação Estagnada</span>
               </div>
             ) : nextDelivery ? (
               <div className="flex flex-col gap-0.5">
                 <div className="flex items-center gap-2">
                   <Package size={14} className="text-zinc-200 shrink-0" />
                   <span className="text-zinc-200 text-sm font-bold truncate max-w-[220px]">{nextDelivery.descricao}</span>
                 </div>
                 <span className="text-sky-600 text-[10px] font-black tracking-widest uppercase pl-6">
                   Vence em {displayDate(nextDelivery.data_entrega_prevista)}
                 </span>
               </div>
             ) : (
               <span className="text-zinc-200 text-sm font-bold italic">Nenhuma entrega mapeada</span>
             )}
           </div>
        </div>

        {/* ── CONTEXTO ESTRATÉGICO ── */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
          <div className="absolute top-[-20] md:top-8 right-0 p-8 opacity-8 pointer-events-none">
            <TrendingUp className="hidden md:block md:w-20 md:h-20" />
          </div>
          <div className="relative z-10">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-sky-500" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-200">Diretriz Estratégica</span>
                {projeto.override_ativo && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 ml-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse block" />
                    <span className="text-[8px] font-black uppercase text-amber-400">Override</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => isEditingFactual ? handleFactualSave() : setIsEditingFactual(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black uppercase tracking-widest ${isEditingFactual ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-800/50 border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500'}`}
                >
                  {isEditingFactual ? <CheckCircle2 size={10} /> : <Edit3 size={10} />}
                  {isEditingFactual ? 'Salvar' : 'Editar'}
                </button>

                <Link 
                  href={`/clientes/${projeto.clienteId}`} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-sky-500/30 transition-all group/link"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-200 group-hover/link:text-sky-500 transition-colors">Cliente</span>
                  <ArrowUpRight size={10} className="text-zinc-200 group-hover/link:text-sky-500" />
                </Link>
                <Link 
                  href={`/contratos/${projeto.contratoId}`} 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-sky-500/30 transition-all group/link"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-200 group-hover/link:text-sky-500 transition-colors">Contrato</span>
                  <History size={10} className="text-zinc-200 group-hover/link:text-sky-500" />
                </Link>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-white text-base font-bold leading-snug mb-1">{projeto.motivo_auditavel}</p>
            </div>

                   {/* Demandas Extraordinárias Integradas ou Projetos Extras */}
                   {(extras.length > 0 || projeto.isExtra) ? (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/3 border border-amber-500/20 max-w-3xl mb-5">
                         <Zap size={14} className="text-amber-500 mt-0.5 shrink-0" />
                         <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Alerta de Projeto Extra</p>
                            
                            {projeto.descricao && (
                               <p className="text-amber-500/90 text-sm leading-relaxed font-medium">
                                  {projeto.descricao}
                               </p>
                            )}

                            <p className="text-zinc-300 text-xs">
                               {extras.length > 0 
                                ? <>Frentes paralelas solicitadas por <span className="text-white font-bold">{extras[0].solicitado_por_nome}</span> expandem a diretriz original.</>
                                : (!projeto.descricao && "Este é um projeto de escopo extra que corre em paralelo para atender demandas urgentes ou solicitações atípicas.")}
                            </p>
                         </div>
                      </div>
                   ) : (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-500/3 border border-sky-500/20 max-w-3xl mb-5">
                         <Target size={14} className="text-sky-500 mt-0.5 shrink-0" />
                         <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Escopo Principal</p>
                            
                            {projeto.descricao && (
                               <p className="text-sky-500/90 text-sm leading-relaxed font-medium">
                                  {projeto.descricao}
                               </p>
                            )}

                            <p className="text-zinc-300 text-xs">
                               Projeto base ativo. Todas as entregas previstas estão estritamente alinhadas com a diretriz estratégica e contrato original.
                            </p>
                         </div>
                      </div>
                   )}

            {projeto.cadeia_causal && projeto.cadeia_causal.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl px-4 py-3.5 mb-6 max-w-3xl">
                <div className="flex flex-col gap-2">
                  {projeto.cadeia_causal.map((item, idx) => {
                    const isWarning = item.toLowerCase().includes('tensão') || item.toLowerCase().includes('atraso');
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertCircle size={14} className={`shrink-0 mt-0.5 ${isWarning ? 'text-rose-500' : 'text-zinc-500'}`} />
                        <p className={`text-sm ${isWarning ? 'text-rose-400 font-medium' : 'text-zinc-300'}`}>{item}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-700">
              {isEditingFactual ? (
                <>
                  <EditableMetaItem label="Investimento" value={String(fValor)} onChange={(v) => setFValor(Number(v))} type="number" />
                  <EditableMetaItem label="Início" value={fInicio} onChange={setFInicio} type="date" />
                  <EditableMetaItem label="Entrega Prevista" value={fFim} onChange={setFFim} type="date" />
                  <EditableMetaItem label="Status" value={fStatus} onChange={setFStatus} type="select" options={['em andamento', 'concluído', 'cancelado']} />
                </>
              ) : (
                <>
                  <MetaItem label="Investimento" value={formatCurrency(projeto.valor_total)} highlight />
                  <MetaItem label="Início" value={displayDate(projeto.data_inicio)} />
                  <MetaItem label="Entrega Prevista" value={projeto.data_fim_prevista ? displayDate(projeto.data_fim_prevista) : 'A definir'} />
                  <MetaItem label="Status" value={projeto.status} color="sky" />
                </>
              )}
            </div>
          </div>
        </div>
      </header>


       {/* ── CONTEÚDO OPERACIONAL ── */}
       <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
         
         {/* COLUNA PRINCIPAL (EXECUÇÃO OPERACIONAL) */}
         <div className="lg:col-span-7 space-y-8 sm:space-y-10">

           {/* Gestão de Marcos e Backlog */}
           <section>
             <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                   <SectionHeader label="Backlog & Marcos" />
                </div>
                <button 
                  onClick={() => setSelectedItem({ type: 'entrega', projetoId: id })}
                  className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 border border-sky-500/30 bg-sky-500/5 rounded-lg text-sky-500 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/50 transition-all shadow-sm group"
                >
                  <Plus size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-0.5">Novo Marco</span>
                </button>
             </div>

             <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 shadow-2xl">
               <ProjectMarcoList 
                 projetoId={id}
                 data={entregas}
                 refreshSignal={refreshSignal}
                 onEntregaClick={(eid) => setSelectedItem({ type: 'entrega', id: eid })}
                 onToggleSuccess={() => setRefreshSignal(prev => prev + 1)}
               />
             </div>
           </section>

          </div>

          {/* COLUNA SECUNDÁRIA: MEMÓRIA & GOVERNANÇA */}
          <div className="lg:col-span-5">
             {/* Governança Humana */}
             <section>
               <ProjectOperationalOverrides 
                  projetoId={id}
                  observacoes={projeto.observacoes_gerais || ''}
                  historyResumo={projeto.audit_history_resumo}
                  onUpdate={() => setRefreshSignal(prev => prev + 1)}
               />
             </section>
          </div>
        </div>

        {/* ── LINHA 2: PENDÊNCIAS E FINANCEIRO ── */}
        <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 mt-8 sm:mt-10 items-start">
          
          {/* ESQUERDA: Pendências */}
          <div className="lg:col-span-7">
            <section>
              {/* Pendências */}
              <div>
                 <SectionHeader label="Log de Pendências" />
                 <div className="mt-6 space-y-4">
                   {pendencias.length > 0 ? (
                     <>
                       {pendencias.slice(0, 5).map(p => (
                         <div key={p.id} className="bg-zinc-900/40 border-l-2 border-amber-500 p-5 rounded-r-3xl">
                           <div className="flex items-center justify-between mb-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pendência Ativa</p>
                             <p className="text-[10px] text-zinc-400 font-bold">Prazo: {displayDate(p.data_prazo)}</p>
                           </div>
                           <p className="text-white text-sm font-bold mb-1">{p.descricao}</p>
                           <p className="text-zinc-300 text-[10px] uppercase font-bold tracking">Responsável: {p.responsavel}</p>
                         </div>
                       ))}
                       {pendencias.length > 5 && (
                         <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest pl-2 mt-4">
                            + {pendencias.length - 5} pendências arquivadas
                         </p>
                       )}
                     </>
                   ) : (
                     <EmptyBox message="Nenhuma pendência ativa" />
                   )}
                 </div>
              </div>
            </section>
          </div>

          {/* DIREITA: Fluxo Financeiro */}
          <div className="lg:col-span-5">
            <section>
              <SectionHeader label="Fluxo Financeiro" />
              <div className="mt-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-lg">
                <div className="bg-zinc-800/20 p-4 border-b border-zinc-800/50 flex items-center gap-2">
                   <DollarSign size={14} className="text-sky-400" />
                   <p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-sky-400">Cronograma de Recebíveis</p>
                </div>
                {parcelas.length > 0 ? (
                  <div className="divide-y divide-zinc-800/50">
                    {parcelasVisiveis.map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                        <div>
                          <p className="text-white text-sm font-bold">Parcela {p.numero_parcela}</p>
                          <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{displayDate(p.data_pagamento_prevista)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-zinc-200 font-black text-sm">{formatCurrency(p.valor_parcela)}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${p.pago ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {p.pago ? 'Pago' : 'Pendente'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!showAllParcelas && parcelasOcultas > 0 && (
                      <button
                        onClick={() => setShowAllParcelas(true)}
                        className="w-full p-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors text-center border-t border-zinc-800/50"
                      >
                        Ver histórico completo ({parcelasOcultas} parcela{parcelasOcultas > 1 ? 's' : ''})
                      </button>
                    )}
                  </div>
                ) : (
                  <EmptyBox message="Sem parcelas registradas." />
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ── LINHA 3: CRISES E TIMELINE ── */}
        <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 items-start">
          
          {/* ESQUERDA: Eventos Críticos (Crises) */}
          <div className="lg:col-span-7">
            <section>
              <div>
                 <SectionHeader label="Crises Institucionais" />
                 <div className="mt-4 space-y-2">
                   {eventos.length > 0 ? (
                     <>
                       {eventos.slice(0, 5).map(ev => (
                         <div key={ev.id} className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-3.5 flex items-start gap-3 hover:bg-zinc-900/30 transition-colors">
                           <span className="size-2 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse" />
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between gap-4 mb-1">
                               <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/80">Crise Institucional</p>
                               <p className="text-[10px] text-zinc-500 font-bold">{displayDate(ev.data_evento)}</p>
                             </div>
                             <p className="text-zinc-300 text-xs font-semibold leading-relaxed">{ev.descricao}</p>
                             {ev.acao_tomada && (
                               <div className="mt-2 bg-black/10 border-l border-zinc-800 pl-2.5 py-1 text-[10.5px] italic text-sky-400/90 leading-snug">
                                 {ev.acao_tomada}
                               </div>
                             )}
                           </div>
                         </div>
                       ))}
                       {eventos.length > 3 && (
                         <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest pl-2 mt-2">
                            + {eventos.length - 3} crises registradas no histórico
                         </p>
                       )}
                     </>
                   ) : (
                     <EmptyBox message="Sem crises registradas" />
                   )}
                 </div>
              </div>
            </section>
          </div>

          {/* DIREITA: Timeline Factual */}
          <div className="lg:col-span-5">
            <section>
               <SectionHeader label="Timeline Factual" />
               <div className="mt-4 bg-zinc-900/10 border border-zinc-800/30 rounded-2xl p-4 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
                 <ProjectTimeline events={projeto.timeline || []} />
               </div>
            </section>
          </div>
        </div>

      {/* OPERATIONAL DRAWER */}
      <OperationalDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          selectedItem?.type === 'entrega' ? 'Marco de Entrega' : 'Gestão de Projeto'
        }
      >
        {selectedItem?.type === 'entrega' && (
          <EntregaManager 
            id={selectedItem.id}
            projetoId={selectedItem.projetoId}
            onUpdate={() => {
              setRefreshSignal(prev => prev + 1)
              setSelectedItem(null)
            }}
          />
        )}
      </OperationalDrawer>
    </main>
  )
}

/* ── COMPONENTES INTERNOS ── */

function MetaItem({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  const colorMap: Record<string, string> = {
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    zinc: 'text-zinc-500'
  }
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-1">{label}</p>
      <p className={`font-bold ${highlight ? 'text-white text-lg sm:text-xl' : 'text-zinc-200 text-sm'} ${color ? colorMap[color] : ''}`}>
        {value}
      </p>
    </div>
  )
}

function EditableMetaItem({ label, value, onChange, type, options }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]
}) {
  return (
    <div className="animate-in zoom-in-95 duration-200">
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-1.5">{label}</p>
      {type === 'select' ? (
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-zinc-800/80 border border-zinc-700/50 text-white text-xs font-bold rounded-lg px-2 py-1 w-full focus:outline-none focus:border-emerald-500/50"
        >
          {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-zinc-800/80 border border-zinc-700/50 text-white text-xs font-bold rounded-lg px-2 py-1 w-full focus:outline-none focus:border-emerald-500/50"
        />
      )}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 w-full">
      <h2 className="text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-zinc-200 shrink-0">{label}</h2>
      <div className="h-px bg-zinc-700 flex-1" />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planejado: 'bg-zinc-800 text-zinc-400 border-zinc-700/30',
    'em andamento': 'bg-sky-900/40 text-sky-400 border-sky-800/30',
    'concluído': 'bg-emerald-900/40 text-emerald-400 border-emerald-800/30',
    cancelado: 'bg-red-900/40 text-red-400 border-red-800/30',
  }
  return (
    <span className={`px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest ${colors[status] || colors.planejado}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="py-10 px-6 border border-zinc-800/50 border-dashed rounded-3xl text-center">
      <p className="text-zinc-600 text-[10px] uppercase font-black tracking-widest">{message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090D] p-12 space-y-12 animate-pulse">
      <div className="h-8 w-48 bg-zinc-900 rounded-xl" />
      <div className="h-64 bg-zinc-900 rounded-[40px]" />
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-8 h-96 bg-zinc-900/50 rounded-[40px]" />
        <div className="col-span-4 h-96 bg-zinc-900/50 rounded-[40px]" />
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center p-5">
      <p className="text-6xl mb-6">🌑</p>
      <h2 className="text-white font-black text-2xl mb-2">Projeto Fora de Alcance</h2>
      <p className="text-zinc-500 text-center max-w-xs mb-10 text-sm leading-relaxed">{message}</p>
      <Link href="/projetos" className="bg-zinc-800 hover:bg-zinc-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-black/40">
        Voltar para Projetos
      </Link>
    </div>
  )
}
