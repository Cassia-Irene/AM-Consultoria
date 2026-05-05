'use client'
// app/pendencias/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { PendenciaCard, Pendencia } from '../../components/PendenciaCard'
import { Pendencias } from '../../lib/mocks'
import { getClientes } from '@/mappers/cliente.mapper'

type Filtro = 'todas' | 'urgente' | 'atencao' | 'andamento' | 'resolvida'

const FILTROS: { value: Filtro; label: string; color: string; activeColor: string }[] = [
  { value: 'todas',     label: 'Todas',       color: 'text-gray-500 bg-gray-100',    activeColor: 'text-white bg-gray-800'    },
  { value: 'urgente',   label: 'Urgentes',    color: 'text-red-700 bg-red-50',       activeColor: 'text-white bg-red-600'     },
  { value: 'atencao',   label: 'Atenção',     color: 'text-amber-700 bg-amber-50',   activeColor: 'text-white bg-amber-500'   },
  { value: 'andamento', label: 'Andamento',   color: 'text-blue-700 bg-blue-50',     activeColor: 'text-white bg-blue-600'    },
  { value: 'resolvida', label: 'Resolvidas',  color: 'text-green-700 bg-green-50',   activeColor: 'text-white bg-green-600'   },
]

const STATUS_ORDER: Record<Pendencia['status'], number> = {
  urgente: 0, atencao: 1, andamento: 2, resolvida: 3,
}

export default function PendenciasPage() {
  const [filtro, setFiltro] = useState<Filtro>('todas')

  // Mapeia clienteId → nome do cliente e garante campo 'cliente' exigido pelo tipo
  const pendenciasComCliente: Pendencia[] = Pendencias.map(p => {
    // Mapeia o status do mock/domínio para o status visual do PendenciaCard
    let statusVisual: Pendencia['status'] = 'andamento'
    if (p.status === 'concluida') {
      statusVisual = 'resolvida'
    } else if (p.prioridade === 'urgente') {
      statusVisual = 'urgente'
    } else if (p.prioridade === 'atencao') {
      statusVisual = 'atencao'
    }

    return {
      id: p.id,
      titulo: p.titulo,
      cliente: getClientes().find(c => c.id === p.clienteId)?.nome_instituicao ?? p.clienteId,
      prazo: p.prazo,
      status: statusVisual,
      diasAtraso: (p as { diasAtraso?: number }).diasAtraso,
      descricao: p.descricao,
    }
  })

  const [pendencias, setPendencias] = useState<Pendencia[]>(pendenciasComCliente)

  const filtradas = pendencias
    .filter(p => filtro === 'todas' || p.status === filtro)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  const urgentesCount  = pendencias.filter(p => p.status === 'urgente').length
  const abertas        = pendencias.filter(p => p.status !== 'resolvida').length

  function handleResolve(id: string) {
    setPendencias(prev =>
      prev.map(p => p.id === id ? { ...p, status: 'resolvida' as const } : p)
    )
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* ── HEADER ── */}
      <div className="bg-[#001845] px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/dashboard" className="text-blue-200 text-2xl leading-none">‹</Link>
          <h1 className="text-lg font-medium text-white">Pendências</h1>
          {urgentesCount > 0 && (
            <span className="ml-auto flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-medium">
              {urgentesCount}
            </span>
          )}
        </div>

        {/* ── FILTROS ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {FILTROS.map(f => {
            const count = f.value === 'todas'
              ? pendencias.length
              : pendencias.filter(p => p.status === f.value).length
            const isActive = filtro === f.value
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-colors
                  ${isActive ? f.activeColor : f.color}
                `}
              >
                {f.label} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* ── CONTAGEM ── */}
        <p className="text-sm text-gray-400 mb-4">
          {abertas} abertas · {pendencias.filter(p => p.status === 'resolvida').length} resolvidas
        </p>

        {/* ── LISTA ── */}
        {filtradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-gray-400 text-sm">Nenhuma pendência aqui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map(p => (
              <PendenciaCard
                key={p.id}
                pendencia={p}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB — Nova pendência ── */}
      <button className="fixed bottom-6 right-4 bg-[#001845] text-white rounded-2xl px-5 py-4 text-[15px] font-medium shadow-lg active:scale-95 transition-transform z-20">
        + Nova pendência
      </button>
    </main>
  )
}