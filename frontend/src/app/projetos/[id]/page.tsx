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
import { TrendingUp, Zap, FileText, AlertCircle, DollarSign, Package, Edit3, CheckCircle2 } from 'lucide-react'

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

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32 overflow-x-hidden">

      <header className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">

        {/* Nav Context */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/projetos" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-sky-500 transition-colors">
            ← Projetos
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/clientes/${projeto.clienteId}`} className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest">Cliente</Link>
            <span className="text-zinc-800">·</span>
            <Link href={`/contratos/${projeto.contratoId}`} className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest">Contrato #{projeto.contratoId}</Link>
            {(projeto.isExtra || extras.length > 0) && (<><span className="text-zinc-800">·</span><span className="text-amber-500/70 text-[10px] font-black uppercase tracking-widest">Extra</span></>)}
            <span className="text-zinc-800">·</span>
            <StatusBadge status={projeto.status} />
          </div>
        </div>

        {/* Título */}
        <div className="mb-5">
          {isEditingTitle ? (
            <input autoFocus value={fTitle} onChange={(e) => setFTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="bg-zinc-900 border border-sky-500/50 text-white text-2xl sm:text-3xl font-black tracking-tight px-4 py-2 rounded-2xl w-full max-w-2xl focus:outline-none" />
          ) : (
            <h1 onClick={() => setIsEditingTitle(true)} className="text-white text-2xl sm:text-3xl font-black tracking-tight cursor-text hover:text-sky-400 transition-colors group inline-flex items-center gap-3">
              {projeto.titulo}
              <Edit3 size={14} className="opacity-0 group-hover:opacity-20 transition-opacity" />
            </h1>
          )}
        </div>

        {/* ── SINAIS VITAIS ── */}
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-6 py-5 px-8 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl mb-8">
           
           {/* Avanço */}
           <div className="flex flex-col gap-1.5 min-w-[140px]">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Avanço Factual</span>
             <div className="flex items-center gap-3">
               <span className="text-white text-3xl font-black tabular-nums leading-none">{progressPercent}%</span>
               <div className="hidden sm:flex flex-col gap-1">
                 <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                   <div className="h-full bg-sky-500 transition-all" style={{ width: `${progressPercent}%` }} />
                 </div>
                 <span className="text-zinc-600 text-[9px] font-bold tracking-widest uppercase">
                   {entregas.filter(e => e.entregue).length}/{entregas.length} marcos
                 </span>
               </div>
             </div>
           </div>
           
           <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

           {/* Tensão */}
           <div className="flex flex-col gap-1.5">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tensão</span>
             <div className="flex items-center gap-2">
               <Zap size={18} className={tensionColor} />
               <span className={`text-lg font-black uppercase tracking-widest ${tensionColor}`}>{tensionLevel}</span>
             </div>
           </div>

           <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

           {/* Backlog */}
           <div className="flex flex-col gap-1.5">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Atrasos Ativos</span>
             {lateCount > 0 ? (
               <div className="flex items-center gap-2">
                 <AlertCircle size={18} className="text-rose-500" />
                 <span className="text-rose-500 text-xl font-black tabular-nums leading-none">{lateCount}</span>
                 {projeto.backlog_meta && projeto.backlog_meta.aging_medio > 0 && (
                   <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest ml-1">{projeto.backlog_meta.aging_medio}d aging</span>
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
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
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
                   <Package size={14} className="text-zinc-500 shrink-0" />
                   <span className="text-zinc-200 text-sm font-bold truncate max-w-[220px]">{nextDelivery.descricao}</span>
                 </div>
                 <span className="text-zinc-500 text-[10px] font-black tracking-widest uppercase pl-6">
                   Vence em {displayDate(nextDelivery.data_entrega_prevista)}
                 </span>
               </div>
             ) : (
               <span className="text-zinc-600 text-sm font-bold italic">Nenhuma entrega mapeada</span>
             )}
           </div>
        </div>

        {/* ── CONTEXTO ESTRATÉGICO ── */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-sky-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Diretriz Estratégica</span>
                {projeto.override_ativo && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 ml-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse block" />
                    <span className="text-[8px] font-black uppercase text-amber-400">Override</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => isEditingFactual ? handleFactualSave() : setIsEditingFactual(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black uppercase tracking-widest ${isEditingFactual ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 hover:text-white hover:border-zinc-500'}`}
              >
                {isEditingFactual ? <CheckCircle2 size={10} /> : <Edit3 size={10} />}
                {isEditingFactual ? 'Salvar' : 'Editar'}
              </button>
            </div>

            <div className="mb-4">
              <p className="text-white text-base font-bold leading-snug mb-1">{projeto.motivo_auditavel}</p>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-3xl">{projeto.descricao || 'Nenhuma diretriz definida.'}</p>
            </div>

            {projeto.cadeia_causal && projeto.cadeia_causal.length > 0 && (
              <div className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 mb-4">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {projeto.cadeia_causal.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-sky-500/40 shrink-0 mt-1.5" />
                      <p className="text-[11px] text-zinc-400">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extras.length > 0 && !projeto.isExtra && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-4">
                <Zap size={11} className="text-amber-500 shrink-0" />
                <p className="text-zinc-400 text-xs">Escopo extra solicitado por <span className="text-zinc-200 font-bold">{extras[0].solicitado_por_nome}</span>.</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/50">
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
         
         {/* COLUNA ESQUERDA: ENTREGAS (CENTRO OPERACIONAL) */}
         <div className="lg:col-span-8 space-y-8 sm:space-y-10">
           <section>
             <SectionHeader label="Gestão de Marcos e Backlog" />
             
             <div className="mt-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 shadow-2xl">
               <ProjectMarcoList 
                 projetoId={id}
                 data={entregas}
                 refreshSignal={refreshSignal}
                 onEntregaClick={(eid) => setSelectedItem({ type: 'entrega', id: eid })}
                 onAddEntrega={() => setSelectedItem({ type: 'entrega', projetoId: id })}
               />
             </div>
           </section>

           {/* Contexto de Risco: Eventos Críticos & Pendências */}
           <section className="space-y-8">
             <div>
               <SectionHeader label="Pendências Operacionais" />
               <div className="mt-6 space-y-4">
                 {pendencias.length > 0 ? (
                   pendencias.slice(0, 3).map(p => (
                     <div key={p.id} className="bg-zinc-900/40 border-l-2 border-amber-500/50 p-5 rounded-r-3xl">
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pendência Ativa</p>
                         <p className="text-[10px] text-zinc-500 font-bold">Prazo: {displayDate(p.data_prazo)}</p>
                       </div>
                       <p className="text-zinc-200 text-sm font-bold mb-1">{p.descricao}</p>
                       <p className="text-zinc-500 text-[10px] uppercase font-black tracking-tighter">Responsável: {p.responsavel}</p>
                     </div>
                   ))
                 ) : (
                   <EmptyBox message="Nenhuma pendência operacional ativa." />
                 )}
               </div>
             </div>

             <div>
               <SectionHeader label="Histórico de Crises Institucionais" />
               <div className="mt-6 space-y-4">
                 {eventos.length > 0 ? (
                   eventos.slice(0, 3).map(ev => (
                     <div key={ev.id} className="bg-zinc-900/40 border-l-2 border-rose-500/50 p-5 rounded-r-3xl">
                       <div className="flex items-center justify-between mb-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Evento Crítico</p>
                         <p className="text-[10px] text-zinc-500 font-bold">{displayDate(ev.data_evento)}</p>
                       </div>
                       <p className="text-zinc-200 text-sm font-bold mb-2">{ev.descricao}</p>
                       {ev.acao_tomada && (
                         <div className="bg-black/20 p-3 rounded-xl border border-zinc-800/50 mt-3">
                           <p className="text-[9px] font-black uppercase text-zinc-500 mb-1">Resposta do Adriano</p>
                           <p className="text-zinc-400 text-xs italic">{ev.acao_tomada}</p>
                         </div>
                       )}
                     </div>
                   ))
                 ) : (
                   <EmptyBox message="Sem eventos críticos registrados." />
                 )}
               </div>
             </div>
           </section>
         </div>

         {/* COLUNA DIREITA: FINANCEIRO & GOVERNANÇA */}
         <div className="lg:col-span-4 space-y-10">
           {/* Governança Humana */}
           <section>
              <ProjectOperationalOverrides 
                 projetoId={id}
                 observacoes={projeto.observacoes_gerais || ''}
                  historyResumo={projeto.audit_history_resumo}
                 onUpdate={() => setRefreshSignal(prev => prev + 1)}
              />
           </section>

           {/* Timeline Operacional */}
           <section>
              <SectionHeader label="Timeline Factual" />
              <div className="mt-6 bg-zinc-900/20 border border-zinc-800/40 rounded-3xl p-6 shadow-inner overflow-hidden">
                <ProjectTimeline events={projeto.timeline || []} />
              </div>
           </section>

           {/* Ciclo Financeiro */}
           <section>
             <SectionHeader label="Fluxo de Pagamentos" />
             <div className="mt-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-lg">
               <div className="bg-zinc-800/20 p-4 border-b border-zinc-800/50 flex items-center gap-2">
                  <DollarSign size={14} className="text-sky-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cronograma de Recebíveis</p>
               </div>
               {parcelas.length > 0 ? (
                 <div className="divide-y divide-zinc-800/50">
                   {parcelas.map(p => (
                     <div key={p.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                       <div>
                         <p className="text-white text-sm font-bold">Parcela {p.numero_parcela}</p>
                         <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{displayDate(p.data_pagamento_prevista)}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-zinc-200 font-black text-sm">{formatCurrency(p.valor_parcela)}</p>
                         <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${p.pago ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {p.pago ? 'Pago' : 'Pendente'}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <EmptyBox message="Sem parcelas registradas." />
               )}
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
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className={`font-bold ${highlight ? 'text-white text-lg sm:text-xl' : 'text-zinc-300 text-sm'} ${color ? colorMap[color] : ''}`}>
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
      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">{label}</p>
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
      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 shrink-0">{label}</h2>
      <div className="h-px bg-zinc-800/40 flex-1" />
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
