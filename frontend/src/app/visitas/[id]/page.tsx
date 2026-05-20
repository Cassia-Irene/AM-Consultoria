'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VisitasService } from '@/services/visitas.service'
import { VisitasExtraService } from '@/services/visitas-extra.service'
import { ContatosService } from '@/services/contatos.service'
import { EventosService, EventoCritico } from '@/services/eventos.service'
import type { Visita } from '@/domain/visita'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VisitaDetalhePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [visita, setVisita] = useState<Visita | null>(null)
  const [crise, setCrise] = useState<EventoCritico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [solicitanteNome, setSolicitanteNome] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const v = await VisitasService.getById(id)
        setVisita(v)
        
        // Buscar situação crítica associada
        try {
          const ev = await EventosService.getByVisitaId(id)
          setCrise(ev)
        } catch (evErr) {
          console.warn('[VISITA_DETAIL] Falha ao carregar situação crítica:', evErr)
        }
        
        try {
          const extras = await VisitasExtraService.getAll()
          const extra = extras.find(e => Number(e.id_visita) === Number(id))
          if (extra) {
            const contatos = await ContatosService.getAll()
            const contato = contatos.find(c => Number(c.id) === Number(extra.solicitado_por))
            if (contato) {
              setSolicitanteNome(contato.nome)
            } else {
              setSolicitanteNome(`Contato #${extra.solicitado_por}`)
            }
          }
        } catch (exErr) {
          console.warn('[VISITA_DETAIL] Falha ao carregar metadados de visita extra:', exErr)
        }
      } catch (err) {
        console.error('[VISITA_DETAIL]', err)
        setError('Não foi possível carregar os detalhes da visita.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) return <LoadingSkeleton />
  if (error || !visita) return <ErrorState message={error || 'Visita não encontrada'} />

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-20">
      <header className="px-6 pt-12 pb-6 border-b border-zinc-800/50 bg-zinc-900/20 sticky top-0 z-10 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-sky-500 transition-colors mb-4 flex items-center gap-1.5"
        >
          <ArrowLeft size={10} strokeWidth={3} />
          Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className={`size-2 rounded-full ${visita.status === 'realizada' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`} />
               <h1 className="text-white text-2xl font-black tracking-tight uppercase italic">Log de Visita</h1>
            </div>
            <p className="text-zinc-300 text-xs font-bold tabular-nums md:mt-4">
              {new Date(visita.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · 
              {new Date(visita.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-zinc-800 rounded text-zinc-300 border border-zinc-700/50">
              #{visita.id}
            </span>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        
        {/* Contexto */}
        <section className={`grid gap-4 ${solicitanteNome ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1 md:mb-2">Tipo</p>
            <p className="text-white font-bold text-sm capitalize">{visita.tipo_visita}</p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1 md:mb-2">Modalidade</p>
            <p className="text-white font-bold text-sm capitalize">{visita.modalidade}</p>
          </div>
          {solicitanteNome && (
            <div className="bg-[#001845]/40 border border-[#002855]/60 rounded-2xl p-4 animate-in fade-in duration-200">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-400 mb-1">⭐ Visita Extra</p>
              <p className="text-white font-bold text-sm truncate">Solicitado por: {solicitanteNome}</p>
            </div>
          )}
        </section>

        {/* Relato Principal */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0466C8]">O que aconteceu</h2>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-xl">
            <p className="text-zinc-200 text-base leading-relaxed">
              {visita.descricao}
            </p>
          </div>
        </section>

        {/* Situação Crítica (Causalidade Operacional) */}
        {crise && (
          <section className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              Situação Crítica / Alerta Institucional
            </h2>
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-3xl p-6 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1.5">Descrição da Intercorrência</p>
                <p className="text-zinc-200 text-sm leading-relaxed">{crise.descricao}</p>
              </div>
              {crise.acao_tomada && (
                <div className="pt-3 border-t border-rose-500/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-400 mb-1.5">Ação e Intervenção Realizada</p>
                  <p className="text-sky-300 text-sm leading-relaxed italic">{crise.acao_tomada}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Resultados */}
        {visita.resultados && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Resultados e Conclusões</h2>
            <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-3xl p-6">
              <p className="text-emerald-100/90 text-base leading-relaxed italic">
                &quot;{visita.resultados}&quot;
              </p>
            </div>
          </section>
        )}

        {/* Duração */}
        {visita.duracao_minutos && (
          <div className="flex items-center gap-3 px-2">
            <div className="size-2 rounded-full bg-sky-500" />
            <p className="text-zinc-200 text-xs md:text-sm font-medium">
              Duração da imersão: <span className="text-sky-500">{visita.duracao_minutos} minutos</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer com ações */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#07090D] via-[#07090D]/90 to-transparent pointer-events-none">
         <div className="max-w-2xl mx-auto flex gap-3 pointer-events-auto">
            <Link href={`/visitas/${id}/editar`} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl text-center transition-all active:scale-[0.98]">
              Editar Log
            </Link>
         </div>
      </div>
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090D] p-10 space-y-8 animate-pulse">
      <div className="h-6 w-32 bg-zinc-900 rounded" />
      <div className="h-32 bg-zinc-900 rounded-3xl" />
      <div className="h-64 bg-zinc-900/50 rounded-3xl" />
      <div className="h-40 bg-zinc-900/30 rounded-3xl" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center p-10 text-center">
      <p className="text-4xl mb-4">📍</p>
      <h2 className="text-white font-black text-xl mb-2">Log não encontrado</h2>
      <p className="text-zinc-500 text-sm mb-8 max-w-xs">{message}</p>
      <button onClick={() => window.history.back()} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">
        Voltar
      </button>
    </div>
  )
}
