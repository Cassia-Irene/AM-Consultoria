'use client'

import React from 'react'
import { AlertCircle, ChevronRight, Package, Clock, ShieldAlert } from 'lucide-react'
import { type AttentionItem } from '@/services/analytics.service'

interface AttentionPanelProps {
  items: AttentionItem[]
  onItemClick?: (id: number) => void
  isInline?: boolean
}

export const AttentionPanel: React.FC<AttentionPanelProps> = ({ items, onItemClick, isInline }) => {
  if (!items || items.length === 0) return null

  const containerClasses = isInline
    ? "w-full mb-8"
    : "fixed bottom-32 left-4 right-4 z-40 max-w-md mx-auto"

  return (
    <div className={containerClasses}>
      <div className={`bg-[#0D1117]/95 border border-rose-500/30 rounded-3xl shadow-2xl shadow-rose-950/20 overflow-hidden ${!isInline ? 'backdrop-blur-md' : ''}`}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-rose-500/10 flex items-center justify-between bg-rose-500/5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Atenção Prioritária</span>
          </div>
          <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>

        {/* List */}
        <div className={`${isInline ? 'max-h-[500px]' : 'max-h-[320px]'} overflow-y-auto scrollbar-hide`}>
          {items.map((item) => (
            <div 
              key={item.idContrato}
              onClick={() => onItemClick?.(item.idContrato)}
              className="group p-5 border-b border-zinc-800/50 last:border-0 active:bg-zinc-800/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-bold text-sm truncate">{item.cliente}</h4>
                    {item.stagnationRisk && (
                      <span className="shrink-0 size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-rose-400 text-[11px] font-medium leading-tight mb-1">
                    {item.summary}
                  </p>
                  <p className="text-[9px] text-zinc-500 italic mb-3">
                    {item.statusOperacional}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold">{item.lastDeliveryDays}d sem entrega</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package size={12} className="text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold">{item.progressoReal}% avanço</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <div className={`size-8 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 ${
                    item.state === 'emergência' 
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-500' 
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  }`}>
                    <AlertCircle size={16} />
                  </div>
                  <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-zinc-900/50 text-center">
          <p className="text-[9px] text-zinc-500 font-medium italic">
            {isInline ? 'Clique em um contrato para analisar detalhes' : 'Arraste para cima para ver detalhes profundos'}
          </p>
        </div>
      </div>
    </div>
  )
}
