'use client'
// app/clientes/page.tsx
//
// Página de gestão de clientes refatorada para o padrão visual Dark/Premium do dashboard.
// Utiliza mappers e domain limpos.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClientesService } from '@/services/clientes.service'
import type { Cliente } from '@/domain/cliente'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { ClientManager } from '@/components/ClientManager'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>()

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await ClientesService.getAll()
      setClientes(data)
    } catch (err) {
      console.error('[ERROR][UI] Erro ao carregar clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData()
    }, 0)
    return () => clearTimeout(timeout)
  }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

  if (loading && clientes.length === 0) {
    return (
      <main className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <p className="text-zinc-500 animate-pulse text-[10px] font-black uppercase tracking-[0.2em]">Carregando Clientes</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-[#07090D]/95 backdrop-blur-sm px-5 pt-10 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-white text-xl font-black tracking-tight">Clientes</h1>
          </div>
          <button 
            onClick={() => {
              setSelectedClientId(undefined)
              setIsDrawerOpen(true)
            }}
            className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all active:scale-[0.98]"
          >
            + Novo Cliente
          </button>
        </div>
        <div className="flex items-center justify-between ml-10">
          <p className="text-zinc-500 text-xs font-medium">Gestão de instituições e parceiros</p>
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{hoje}</p>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-4">
        {(() => {
          const filtered = clientes.filter(c => c.status === 'ativo')
          if (filtered.length === 0) return (
            <div className="py-20 text-center">
              <p className="text-zinc-600 text-sm font-medium italic">Nenhum cliente ativo encontrado</p>
            </div>
          )
          return filtered.map((cliente) => (
            <Link key={cliente.id} href={`/clientes/${cliente.id}`} className="block">
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all group active:scale-[0.99]">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-lg leading-tight truncate group-hover:text-sky-400 transition-colors">
                      {cliente.nome_instituicao}
                    </h2>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mt-0.5">
                      {cliente.tipo_instituicao}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 bg-emerald-900/40 text-emerald-400 border-emerald-800/30">
                    Ativo
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-zinc-800/50">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Localização</p>
                    <p className="text-zinc-300 text-sm font-bold truncate">{cliente.cidade}</p>
                  </div>
                  {cliente.nivel_complexidade && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Complexidade</p>
                      <p className="text-zinc-300 text-sm font-bold">{cliente.nivel_complexidade}</p>
                    </div>
                  )}
                </div>

                {cliente.observacoes_gerais && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Notas Operacionais</p>
                    <p className="text-zinc-500 text-xs leading-relaxed italic line-clamp-2">
                      &quot;{cliente.observacoes_gerais}&quot;
                    </p>
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <div className="text-[11px] font-black uppercase tracking-widest text-sky-500 flex items-center gap-1 group/btn">
                    Ver prontuário
                    <svg className="group-hover/btn:translate-x-0.5 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))
        })()}
      </div>

      <OperationalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedClientId ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <ClientManager 
          id={selectedClientId} 
          onClose={() => setIsDrawerOpen(false)} 
          onSuccess={loadData}
        />
      </OperationalDrawer>
    </main>
  )
}