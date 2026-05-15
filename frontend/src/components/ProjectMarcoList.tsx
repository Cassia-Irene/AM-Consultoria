'use client'

import React, { useState, useEffect } from 'react'
import { EntregasService } from '@/services/entregas.service'
import { type Entrega } from '@/domain/entrega'
import { CheckCircle2, Circle, Plus, AlertCircle, Edit2 } from 'lucide-react'
import { displayDate } from '@/utils/date'

interface ProjectMarcoListProps {
  projetoId: string | number
  onEntregaClick?: (id: string | number) => void
  onAddEntrega?: (projetoId: string | number) => void
  refreshSignal?: number
  readOnly?: boolean
  data?: Entrega[]
}

export function ProjectMarcoList({ 
  projetoId, 
  onEntregaClick, 
  onAddEntrega, 
  refreshSignal, 
  readOnly = false,
  data: initialData
}: ProjectMarcoListProps) {
  const [entregas, setEntregas] = useState<Entrega[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)
  
  // Sincronização de Estado durante o render (Evita cascading renders do useEffect)
  const [prevInitialData, setPrevInitialData] = useState<Entrega[] | undefined>(initialData)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData)
    setEntregas(initialData || [])
    if (initialData) setLoading(false)
  }

  const loadEntregas = React.useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await EntregasService.getByProjetoId(String(projetoId))
      const mapped: Entrega[] = data.map(raw => ({
        id: String(raw.id_entrega),
        projetoId: String(raw.id_projeto),
        descricao: raw.descricao,
        data_entrega_prevista: raw.data_entrega_prevista,
        data_entrega_real: raw.data_entrega_real || undefined,
        entregue: raw.entregue,
        referencia_doc: raw.referencia_doc || undefined
      }))
      setEntregas(mapped.sort((a, b) => new Date(a.data_entrega_prevista).getTime() - new Date(b.data_entrega_prevista).getTime()))
    } finally {
      setLoading(false)
    }
  }, [projetoId])


  useEffect(() => {
    // Se temos dados iniciais e não há sinal de refresh, não buscamos
    if (initialData && (!refreshSignal || refreshSignal === 0)) return

    const shouldShowLoading = refreshSignal !== undefined && refreshSignal > 0
    Promise.resolve().then(() => loadEntregas(shouldShowLoading))
  }, [loadEntregas, refreshSignal, initialData])

  async function handleQuickToggle(e: React.MouseEvent, entrega: Entrega) {
    e.stopPropagation()
    const newStatus = !entrega.entregue
    await EntregasService.update(Number(entrega.id), {
      entregue: newStatus,
      data_entrega_real: newStatus ? new Date().toISOString().split('T')[0] : null
    })
    loadEntregas()
  }

  if (loading && entregas.length === 0) return <div className="py-2 animate-pulse text-[9px] text-zinc-600 uppercase font-black">Sincronizando marcos...</div>

  return (
    <div className="space-y-2 mt-4 ml-2 border-l border-zinc-800/50 pl-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Backlog de Valor</span>
        {!readOnly && onAddEntrega && (
          <button 
            onClick={() => onAddEntrega(projetoId)}
            className="text-sky-500 hover:text-sky-400 transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {entregas.length === 0 ? (
        <p className="text-[10px] text-zinc-700 italic">Nenhum marco definido.</p>
      ) : (
        entregas.map(item => {
          const isLate = !item.entregue && new Date(item.data_entrega_prevista) < new Date()
          return (
            <div 
              key={item.id}
              onClick={() => !readOnly && onEntregaClick && onEntregaClick(item.id)}
              className={`group flex items-center gap-3 py-1.5 ${(!readOnly && onEntregaClick) ? 'cursor-pointer' : ''}`}
            >
              <button 
                onClick={(e) => !readOnly && handleQuickToggle(e, item)}
                disabled={readOnly}
                className={`${item.entregue ? 'text-emerald-500' : isLate ? 'text-rose-500' : 'text-zinc-700'} ${!readOnly ? 'hover:scale-110' : ''} transition-transform`}
              >
                {item.entregue ? <CheckCircle2 size={16} /> : isLate ? <AlertCircle size={16} /> : <Circle size={16} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold truncate ${item.entregue ? 'text-zinc-600' : 'text-zinc-300'}`}>
                  {item.descricao}
                </p>
                <p className={`text-[9px] font-black uppercase tracking-tighter ${isLate ? 'text-rose-500' : 'text-zinc-600'}`}>
                  {item.entregue ? `Concluído: ${displayDate(item.data_entrega_real!)}` : `Prazo: ${displayDate(item.data_entrega_prevista)}`}
                  {isLate && ' • ATRASADO'}
                </p>
              </div>

              {!readOnly && onEntregaClick && <Edit2 size={10} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />}
            </div>
          )
        })
      )}
    </div>
  )
}
