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
    <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* HEADER VISITA */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-md text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-sm">
            {visita.tipo_visita}
          </span>
          <span className="text-white text-[12px] md:text-[14px] font-black tabular-nums">
            {displayDate(visita.data_hora)}
          </span>
        </div>

        <div className="bg-[#001845]/40 border border-[#002855] rounded-2xl p-6 md:p-8 shadow-md">
          <p className="text-[11px] md:text-[12px] font-black uppercase tracking-widest text-sky-400 mb-4">Relato de Campo</p>
          <p className="text-white text-[14px] md:text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{visita.descricao}</p>
        </div>
      </section>

      {/* RESULTADOS / IMPACTO */}
      {visita.resultados && (
        <section className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-6 md:p-8 shadow-md">
          <p className="text-[11px] md:text-[12px] font-black uppercase tracking-widest text-emerald-400 mb-4">Impacto / Resultados</p>
          <p className="text-emerald-50 text-[14px] md:text-[15px] italic font-medium leading-relaxed">&quot;{visita.resultados}&quot;</p>
        </section>
      )}

      {/* METADADOS */}
      <section className="grid grid-cols-2 gap-4 md:gap-5">
        <div className="bg-[#001845]/30 border border-[#002855]/50 rounded-2xl p-5 md:p-6 shadow-sm">
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-400/80 mb-2.5">Modalidade</p>
          <p className="text-white text-[14px] md:text-[16px] font-black capitalize">{visita.modalidade}</p>
        </div>
        <div className="bg-[#001845]/30 border border-[#002855]/50 rounded-2xl p-5 md:p-6 shadow-sm">
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-400/80 mb-2.5">Duração Est.</p>
          <p className="text-white text-[14px] md:text-[16px] font-black">1h 30m</p>
        </div>
      </section>

      {/* AÇÕES RELACIONADAS (PENDÊNCIAS GERADAS) */}
      <section className="space-y-4 md:space-y-5">
        <p className="text-[11px] md:text-[12px] font-black uppercase tracking-widest text-sky-400 px-1 md:px-2">Ações Geradas nesta Visita</p>
        <div className="space-y-3 md:space-y-4">
          {/* Aqui idealmente filtraríamos pendências que tem contratoId e data_criacao próxima */}
          <div className="bg-[#001845]/40 border border-[#002855] rounded-2xl p-5 md:p-6 flex items-center justify-between group shadow-sm transition-all hover:border-sky-500/30 hover:bg-[#001845]/60 cursor-pointer">
             <div className="flex items-center gap-4">
                <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] group-hover:scale-110 transition-transform" />
                <p className="text-[14px] md:text-[15px] text-white font-medium">Revisão de faturamento mensal</p>
             </div>
             <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalhe</span>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <div className="pt-8 mt-4 border-t border-zinc-800/80">
        <Link 
          href={`/visitas/${id}`}
          className="block w-full py-4 rounded-xl text-center bg-zinc-900/40 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all"
        >
          Ver Relatório Completo ↗
        </Link>
      </div>
    </div>
  )
}
