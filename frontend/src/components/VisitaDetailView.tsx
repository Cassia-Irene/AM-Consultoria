'use client'

import React, { useState, useEffect } from 'react'
import { VisitasService } from '@/services/visitas.service'
import { displayDate } from '@/utils/date'
import type { Visita } from '@/domain/visita'
import Link from 'next/link'

interface VisitaDetailViewProps {
  id: string | number
}

export function VisitaDetailView({ id }: VisitaDetailViewProps) {
  const [visita, setVisita] = useState<Visita | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await VisitasService.getById(id)
        setVisita(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="size-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Recuperando Log...</p>
    </div>
  )

  if (!visita) return <p className="text-zinc-500 text-center py-10">Log não encontrado.</p>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* HEADER VISITA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
            {visita.tipo_visita}
          </span>
          <span className="text-zinc-500 text-[10px] font-bold tabular-nums">
            {displayDate(visita.data_hora)}
          </span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Relato de Campo</p>
          <p className="text-zinc-200 text-sm leading-relaxed font-medium whitespace-pre-wrap">{visita.descricao}</p>
        </div>
      </section>

      {/* RESULTADOS / IMPACTO */}
      {visita.resultados && (
        <section className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3">Impacto / Resultados</p>
          <p className="text-emerald-100/80 text-sm italic leading-relaxed">&quot;{visita.resultados}&quot;</p>
        </section>
      )}

      {/* METADADOS */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Modalidade</p>
          <p className="text-zinc-300 text-xs font-bold capitalize">{visita.modalidade}</p>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Duração Est.</p>
          <p className="text-zinc-300 text-xs font-bold">1h 30m</p>
        </div>
      </section>

      {/* AÇÕES RELACIONADAS (PENDÊNCIAS GERADAS) */}
      <section className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-1">Ações Geradas nesta Visita</p>
        <div className="space-y-3">
          {/* Aqui idealmente filtraríamos pendências que tem contratoId e data_criacao próxima */}
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-4 flex items-center justify-between group">
             <div className="flex items-center gap-3">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <p className="text-xs text-zinc-400 font-medium">Revisão de faturamento mensal</p>
             </div>
             <span className="text-[8px] font-black uppercase text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalhe</span>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <div className="pt-6 border-t border-zinc-800">
        <Link 
          href={`/visitas/${id}`}
          className="block w-full py-3 rounded-xl text-center text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Ver Relatório Completo ↗
        </Link>
      </div>
    </div>
  )
}
