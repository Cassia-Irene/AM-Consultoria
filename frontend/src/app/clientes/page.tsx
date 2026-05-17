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
import { Plus } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>()
  const [mostrarInativos, setMostrarInativos] = useState(false)

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
      <header className="sticky top-0 z-10 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6 md:mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-3xl font-black tracking-tight">Clientes</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setMostrarInativos(!mostrarInativos)}
              className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border transition-all active:scale-[0.98] ${
                mostrarInativos 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 shadow-md shadow-zinc-950/20' 
                  : 'bg-transparent border-zinc-800 text-zinc-300 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {mostrarInativos ? 'Ocultar Arquivados' : 'Mostrar Arquivados'}
            </button>
            <button 
              onClick={() => {
                setSelectedClientId(undefined)
                setIsDrawerOpen(true)
              }}
              className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-sky-950/20 flex items-center gap-1.5"
            >
              <Plus size={12} strokeWidth={3} />
              Novo
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium transition-colors duration-300 ${mostrarInativos ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}>
            {mostrarInativos ? 'Exibindo ativos + instituições arquivadas' : 'Gestão de instituições e parceiros'}
          </p>
          <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">{hoje}</p>
        </div>
      </header>

      <div className="px-5 pt-6 space-y-4">
        {/* Botões para telas menores (abaixo da descrição do header e acima dos cards) */}
        <div className="flex md:hidden items-center gap-2 mb-10">
          <button 
            onClick={() => setMostrarInativos(!mostrarInativos)}
            className={`flex-1 text-[9px] font-black uppercase tracking-widest py-3 px-2 rounded-lg border text-center transition-all active:scale-[0.98] ${
              mostrarInativos 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200 shadow-md shadow-zinc-950/20' 
                : 'bg-transparent border-zinc-800 text-zinc-300 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {mostrarInativos ? 'Ocultar Arquivados' : 'Mostrar Arquivados'}
          </button>
          <button 
            onClick={() => {
              setSelectedClientId(undefined)
              setIsDrawerOpen(true)
            }}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest py-3 px-2 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-sky-950/20 flex items-center justify-center gap-1.5"
          >
            <Plus size={12} strokeWidth={3} />
            Novo
          </button>
        </div>
        {(() => {
          const filtered = clientes.filter(c => mostrarInativos ? true : c.status === 'ativo')
          if (filtered.length === 0) return (
            <div className="py-20 text-center">
              <p className="text-zinc-600 text-sm font-medium italic">
                {mostrarInativos ? 'Nenhum cliente cadastrado' : 'Nenhum cliente ativo encontrado'}
              </p>
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
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide mt-2">
                      {cliente.tipo_instituicao}
                    </p>
                  </div>
                  {cliente.status === 'ativo' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 bg-emerald-900/40 text-emerald-400 border-emerald-800/30">
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 bg-zinc-800 text-zinc-300 border-zinc-700/50">
                      Arquivado
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-zinc-800/50">
                  <div>
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-500 mb-1">Localização</p>
                    <p className="text-zinc-300 text-sm font-bold truncate">{cliente.cidade}</p>
                  </div>
                  {cliente.nivel_complexidade && (
                    <div>
                      <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-500 mb-1">Complexidade</p>
                      <p className="text-zinc-300 text-sm font-bold">{cliente.nivel_complexidade}</p>
                    </div>
                  )}
                </div>

                {cliente.observacoes_gerais && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-sky-500 mb-2">Notas Operacionais</p>
                    <p className="text-zinc-200 text-xs md:text-sm leading-relaxed italic line-clamp-2">
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