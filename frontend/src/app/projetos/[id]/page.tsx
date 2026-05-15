'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ProjetosService } from '@/services/projetos.service'
import { EntregasService } from '@/services/entregas.service'
import { ParcelasService } from '@/services/parcelas.service'
import { ExtrasService } from '@/services/extras.service'
import { ContratoService } from '@/services/contrato.service'
import { ContatosService } from '@/services/contatos.service'
import { EventosService, type EventoCritico } from '@/services/eventos.service'
import { formatCurrency } from '@/utils/finance'
import { displayDate } from '@/utils/date'
import type { Projeto } from '@/domain/projeto'
import type { Entrega } from '@/domain/entrega'
import type { ProjetoParcela } from '@/domain/projetoParcela'
import type { ProjetoExtra } from '@/domain/projetoExtra'
import type { Contrato } from '@/domain/contrato'
import type { Contato } from '@/domain/contato'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { EntregaManager } from '@/components/EntregaManager'
import { ProjectMarcoList } from '@/components/ProjectMarcoList'
import { TrendingUp, Zap, FileText, AlertCircle, History, DollarSign, Package } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjetoDetalhePage({ params }: PageProps) {
  const { id } = use(params)
  
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [parcelas, setParcelas] = useState<ProjetoParcela[]>([])
  const [extras, setExtras] = useState<ProjetoExtra[]>([])
  const [eventos, setEventos] = useState<EventoCritico[]>([])
  
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

      const [allEntregas, allParcelas, allExtras, allEventos, allContratos, allContatos] = await Promise.all([
        EntregasService.getByProjetoId(id),
        ParcelasService.getByProjetoId(id),
        ExtrasService.getByProjetoId(id),
        EventosService.getByContratoId(foundProjeto.contratoId),
        ContratoService.getAll(),
        ContatosService.getAll()
      ])

      const currentContrato = allContratos.find(c => String(c.id) === String(foundProjeto.contratoId))
      
      setProjeto(foundProjeto)
      setEntregas(allEntregas)
      setParcelas(allParcelas)
      setExtras(allExtras)
      setEventos(allEventos.sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime()))
      setContrato(currentContrato || null)
      setContatos(allContatos)
    } catch (err) {
      console.error('[ERROR][PROJETO_DETAIL]', err)
      setError('Erro ao carregar detalhes do projeto.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    Promise.resolve().then(() => loadData())
  }, [loadData, refreshSignal])

  const getContactName = (cid: string | number) => {
    const found = contatos.find(c => String(c.id) === String(cid))
    return found ? found.nome : `Contato #${cid}`
  }

  if (loading) return <LoadingSkeleton />
  if (error || !projeto) return <ErrorState message={error || 'Projeto inexistente'} />

  // Tensão e Atrasos agora vêm interpretados do Backend (Single Source of Truth)
  const tensionLevel = projeto.nivel_tensao || 'Baixa'
  const tensionColor = tensionLevel === 'Crítica' ? 'text-rose-500' : tensionLevel === 'Moderada' ? 'text-amber-500' : 'text-emerald-500'
  const lateCount = projeto.count_atrasos || 0

  const nextDelivery = entregas
    .filter(e => !e.entregue && new Date(e.data_entrega_prevista) >= new Date())
    .sort((a, b) => new Date(a.data_entrega_prevista).getTime() - new Date(b.data_entrega_prevista).getTime())[0]
  
  const completedCount = entregas.filter(e => e.entregue).length
  const totalCount = entregas.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32 overflow-x-hidden">
      {/* ── HEADER & CONTEXTO ── */}
      <header className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/projetos" 
            className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-sky-500 transition-colors"
          >
            ← Voltar para projetos
          </Link>
          <div className="flex items-center gap-3">
             {(projeto.isExtra || extras.length > 0) && (
                <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border border-amber-500/20">
                   Projeto Extra
                </span>
             )}
             <StatusBadge status={projeto.status} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sky-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Operação de Campo</p>
            <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight sm:leading-none">{projeto.titulo}</h1>
            <div className="flex items-center gap-3 mt-3">
               <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">ID: #{projeto.id} · Contrato Ativo</p>
               {extras.length > 0 && (
                  <p className="text-amber-500/60 text-[10px] font-bold uppercase tracking-widest border-l border-zinc-800 pl-3">
                    Solicitado por: {getContactName(extras[0].solicitado_por)}
                  </p>
               )}
            </div>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-3 text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Tensão Operacional</p>
                <div className="flex items-center gap-2 justify-end">
                   <Zap size={16} className={tensionColor} />
                   <span className={`text-xl font-black uppercase ${tensionColor}`}>
                      {tensionLevel}
                   </span>
                </div>
             </div>
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-3 text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Avanço Real</p>
                <p className="text-white text-xl font-black">{progressPercent}%</p>
             </div>
          </div>
        </div>

        {/* Card de Contexto Operacional */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp size={120} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <div className="flex items-center gap-2">
                      <FileText size={14} className="text-sky-500" />
                      <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Diretriz Estratégica</h3>
                   </div>
                </div>
                <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-3xl">
                   {projeto.descricao || 'Nenhuma descrição operacional definida para este projeto.'}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-zinc-800/50">
                   <MetaItem label="Investimento" value={formatCurrency(projeto.valor_total)} highlight />
                   <MetaItem label="Início" value={displayDate(projeto.data_inicio)} />
                   <MetaItem label="Entrega Prevista" value={projeto.data_fim_prevista ? displayDate(projeto.data_fim_prevista) : 'A definir'} />
                   <MetaItem label="Status" value={projeto.status} color="sky" />
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                   <Package size={14} className="text-emerald-500" />
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Próximo Marco</p>
                </div>
                {nextDelivery ? (
                  <>
                    <p className="text-white font-bold text-sm mb-1">{nextDelivery.descricao}</p>
                    <p className="text-emerald-500 text-xs font-black uppercase tracking-tighter">{displayDate(nextDelivery.data_entrega_prevista)}</p>
                  </>
                ) : (
                  <p className="text-zinc-600 text-xs italic">Nenhuma entrega futura.</p>
                )}
             </div>
             
             <div className={`rounded-3xl p-6 border ${lateCount > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-900/40 border-zinc-800'}`}>
                <div className="flex items-center gap-2 mb-3">
                   <AlertCircle size={14} className={lateCount > 0 ? 'text-rose-500' : 'text-zinc-500'} />
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Backlog Acumulado</p>
                </div>
                <div className="flex items-end gap-2">
                   <p className={`text-3xl font-black ${lateCount > 0 ? 'text-rose-500' : 'text-white'}`}>
                      {lateCount}
                   </p>
                   <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1.5">Atrasos</p>
                </div>
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
                refreshSignal={refreshSignal}
                onEntregaClick={(eid) => setSelectedItem({ type: 'entrega', id: eid })}
                onAddEntrega={() => setSelectedItem({ type: 'entrega', projetoId: id })}
              />
            </div>
          </section>

          {/* Histórico de Crises/Eventos */}
          <section>
            <SectionHeader label="Tensões Institucionais Recentes" />
            <div className="mt-6 space-y-4">
              {eventos.length > 0 ? (
                eventos.slice(0, 5).map(ev => (
                  <div key={ev.id_evento} className="bg-zinc-900/40 border-l-2 border-rose-500/50 p-5 rounded-r-3xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Crise Operacional</p>
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
                <EmptyBox message="Nenhum evento crítico recente vinculado a este contrato." />
              )}
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: FINANCEIRO & EXTRAS */}
        <div className="lg:col-span-4 space-y-10">
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

          {/* Projetos Extras Vinculados */}
          {extras.length > 0 && !projeto.isExtra && (
            <section>
              <SectionHeader label="Demandas Extraordinárias" />
              <div className="mt-6 space-y-3">
                {extras.map(ex => (
                  <div key={ex.id} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl group hover:border-sky-500/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Contexto Extra</p>
                      <Zap size={10} className="text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-200 text-xs font-bold leading-relaxed">
                        Este contrato possui frentes paralelas de expansão de escopo.
                      </p>
                      <p className="text-zinc-500 text-[10px] pt-1 italic">
                        Solicitante: {getContactName(ex.solicitado_por)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Atalhos Rápidos */}
          <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6">
             <SectionHeader label="Navegação 360" />
             <div className="mt-4 flex flex-col gap-2">
                <Link 
                  href={`/clientes/${contrato?.clienteId}`} 
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-xs font-bold transition-all group"
                >
                  <span>Ver Cliente</span>
                  <TrendingUp size={12} className="text-zinc-700 group-hover:text-sky-500" />
                </Link>
                <Link 
                  href={`/contratos/${projeto.contratoId}`} 
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-xs font-bold transition-all group"
                >
                  <span>Ver Contrato</span>
                  <History size={12} className="text-zinc-700 group-hover:text-sky-500" />
                </Link>
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
