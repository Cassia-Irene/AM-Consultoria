'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VisitasService } from '@/services/visitas.service'
import type { Visita } from '@/domain/visita'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VisitaDetalhePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [visita, setVisita] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const v = await VisitasService.getById(id)
        setVisita(v)
        
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
            <p className="text-zinc-500 text-xs font-bold tabular-nums">
              {new Date(visita.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · 
              {new Date(visita.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-zinc-800 rounded text-zinc-400 border border-zinc-700/50">
              #{visita.id}
            </span>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        
        {/* Contexto */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Tipo</p>
            <p className="text-white font-bold text-sm capitalize">{visita.tipo_visita}</p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Modalidade</p>
            <p className="text-white font-bold text-sm capitalize">{visita.modalidade}</p>
          </div>
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
            <div className="size-2 rounded-full bg-zinc-800" />
            <p className="text-zinc-500 text-xs font-medium">
              Duração da imersão: <span className="text-zinc-300">{visita.duracao_minutos} minutos</span>
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
