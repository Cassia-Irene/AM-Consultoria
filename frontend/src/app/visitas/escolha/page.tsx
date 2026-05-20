'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function EscolhaVisitaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryStr = searchParams.toString()
  const urlSuffix = queryStr ? `?${queryStr}` : ''

  return (
    <main className="min-h-screen bg-[#07090D] flex flex-col px-6 pt-10 pb-12">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="size-9 flex items-center justify-center rounded-xl text-[#7D8597] active:text-white active:bg-[#23272F] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">Registrar Visita</h1>
          <p className="text-[#7D8597] text-xs">O que você deseja fazer agora?</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 justify-center max-w-md mx-auto w-full">
        
        {/* Opção 1: Relato Rápido */}
        <Link href={`/visitas/rapida${urlSuffix}`} className="group">
          <div className="bg-[#0d1117] border border-[#23272F] hover:border-[#0466C8]/50 rounded-3xl p-6 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-2xl bg-[#0466C8]/10 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h2 className="text-white text-lg font-bold">Relato Rápido</h2>
                <p className="text-[#0466C8] text-[10px] font-black uppercase tracking-widest">Documentação ágil</p>
              </div>
            </div>
            <p className="text-[#7D8597] text-sm leading-relaxed">
              Ideal para registrar visitas curtas ou quando você está em trânsito. Foco no relato do que aconteceu e pendências simples.
            </p>
          </div>
        </Link>

        {/* Opção 2: Visita Detalhada */}
        <Link href={`/visitas/nova${urlSuffix}`} className="group">
          <div className="bg-[#0d1117] border border-[#23272F] hover:border-[#0466C8]/50 rounded-3xl p-6 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-2xl bg-[#0466C8]/10 flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <h2 className="text-white text-lg font-bold">Visita Detalhada</h2>
                <p className="text-[#0466C8] text-[10px] font-black uppercase tracking-widest">Estruturação completa</p>
              </div>
            </div>
            <p className="text-[#7D8597] text-sm leading-relaxed">
              Registro completo com diagnóstico, resultados detalhados e assistente de geração de pendências para o sistema.
            </p>
          </div>
        </Link>

      </div>

      <div className="mt-auto text-center">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-[#4A5568] text-xs font-bold uppercase tracking-widest hover:text-[#7D8597] transition-colors mb-20"
        >
          Cancelar e voltar
        </button>
      </div>
    </main>
  )
}

export default function EscolhaVisitaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090D] flex items-center justify-center"><span className="text-[#0466C8] animate-pulse font-black tracking-widest text-xs uppercase text-center">Carregando...</span></div>}>
      <EscolhaVisitaForm />
    </Suspense>
  )
}
