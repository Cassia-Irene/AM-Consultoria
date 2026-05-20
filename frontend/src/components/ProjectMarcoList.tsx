'use client'

import React, { useState, useEffect } from 'react'
import { EntregasService } from '@/services/entregas.service'
import { type Entrega } from '@/domain/entrega'
import { CheckCircle2, Circle, AlertCircle, Edit2 } from 'lucide-react'
import { displayDate } from '@/utils/date'

function linkifyText(text: string, linkClass = "text-sky-400 hover:text-sky-300 hover:underline break-all") {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
  const parts = text.split(urlRegex)
  if (parts.length === 1) return text

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('www.') ? `https://${part}` : part
      return (
        <a 
          key={index} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={linkClass}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

interface ProjectMarcoListProps {
  projetoId: string | number
  onEntregaClick?: (id: string | number) => void
  onToggleSuccess?: () => void
  refreshSignal?: number
  readOnly?: boolean
  data?: Entrega[]
}

export function ProjectMarcoList({ 
  projetoId, 
  onEntregaClick, 
  onToggleSuccess,
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
    if (onToggleSuccess) {
      onToggleSuccess()
    }
  }

  if (loading && entregas.length === 0) return <div className="py-2 animate-pulse text-[9px] text-zinc-400 uppercase font-black">Sincronizando marcos...</div>

  return (
    <div className="space-y-5 ml-1.5 border-l-2 border-zinc-700 pl-6">
      {entregas.length === 0 ? (
        <p className="text-[10px] text-zinc-200 italic">Nenhum marco definido.</p>
      ) : (
        entregas.map(item => {
          const isLate = !item.entregue && new Date(item.data_entrega_prevista) < new Date()
          return (
            <div 
              key={item.id}
              onClick={() => !readOnly && onEntregaClick && onEntregaClick(item.id)}
              className={`group flex items-start gap-4 ${(!readOnly && onEntregaClick) ? 'cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-xl transition-colors' : ''}`}
            >
              <button 
                onClick={(e) => !readOnly && handleQuickToggle(e, item)}
                disabled={readOnly}
                className={`mt-[2px] ${item.entregue ? 'text-emerald-500' : isLate ? 'text-rose-500' : 'text-zinc-400'} ${!readOnly ? 'hover:scale-110' : ''} transition-transform`}
              >
                {item.entregue ? <CheckCircle2 size={15} /> : isLate ? <AlertCircle size={15} /> : <Circle size={15} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] md:text-[12px] font-bold whitespace-pre-line break-all ${item.entregue ? 'text-emerald-600' : 'text-zinc-200'}`}>
                  {linkifyText(item.descricao)}
                </p>
                <p className={`text-[9px] md:text-[11px] font-bold uppercase ${isLate ? 'text-rose-500' : 'text-zinc-300'}`}>
                  {item.entregue ? `Concluído: ${displayDate(item.data_entrega_real!)}` : `Prazo: ${displayDate(item.data_entrega_prevista)}`}
                  {isLate && ' • ATRASADO'}
                </p>
              </div>

              {!readOnly && onEntregaClick && <Edit2 size={12} className="text-zinc-200 group-hover:text-sky-500 group-hover:scale-120 transition-all" />}
            </div>
          )
        })
      )}
    </div>
  )
}
