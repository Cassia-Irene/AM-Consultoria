import React from 'react'
import { MapPin, ClipboardCheck, Wallet, Info, ChevronRight, AlertCircle } from 'lucide-react'

export interface TimelinePendencia {
  id: string
  descricao: string
  data_prazo: string
}

export interface TimelineEvent {
  id: string
  idReferencia?: number // ID original do banco para abrir detalhes
  idProjeto?: number | string // ID do projeto associado
  date: string
  type: string
  title: string
  subtitle: string
  critical: boolean
  pendencias?: TimelinePendencia[]
}

interface OperationalTimelineProps {
  events: TimelineEvent[]
  onEventClick?: (event: TimelineEvent) => void
}

export function OperationalTimeline({ events, onEventClick }: OperationalTimelineProps) {
  const getTypeStyles = (type: string, critical: boolean) => {
    if (critical) return { color: 'bg-red-500', icon: AlertCircle }
    switch (type.toLowerCase()) {
      case 'visita': return { color: 'bg-sky-500', icon: MapPin }
      case 'pendencia': return { color: 'bg-emerald-500', icon: ClipboardCheck }
      case 'financeiro': return { color: 'bg-amber-500', icon: Wallet }
      default: return { color: 'bg-zinc-600', icon: Info }
    }
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[13px] sm:before:left-[15px] before:w-0.5 before:bg-[#23272F]">
      {events.map((event) => {
        const { color, icon: Icon } = getTypeStyles(event.type, event.critical)
        return (
          <div key={event.id} className="relative pl-10 sm:pl-12">
            {/* Dot/Icon - Optical Center Alignment */}
            <div className={`absolute left-0 top-1 size-[28px] sm:size-[32px] rounded-full border-4 border-[#07090D] flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${color}`}>
              <Icon size={12} strokeWidth={3} className="text-white sm:scale-110" />
            </div>
            
            {/* Content Card - Design System Spacing (Gap-4) */}
            <div 
              onClick={() => onEventClick?.(event)}
              className={`group bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-5 transition-all ${
                onEventClick ? 'cursor-pointer hover:border-[#0466C8]/40 hover:bg-[#0d1117]/80' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block w-fit max-w-full truncate ${
                  event.critical ? 'bg-red-900/40 text-red-400 border border-red-500/20' : 'bg-[#23272F] text-[#7D8597]'
                }`}>
                  {event.subtitle}
                </span>
                <span className="text-[10px] font-bold tabular-nums text-[#4A5568] shrink-0">
                  {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              
              <h4 className="text-white text-sm font-bold leading-snug group-hover:text-[#0466C8] transition-colors pr-4">
                {event.title}
              </h4>

              {/* Inline Pendencies (Point D) - Logical Hierarchy */}
              {event.pendencias && event.pendencias.length > 0 && (
                <div className="mt-5 space-y-3 pt-4 border-t border-[#23272F]/50">
                   <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Ações Geradas</p>
                   {event.pendencias.map(p => (
                     <div key={p.id} className="flex items-start gap-3 group/item">
                        <ChevronRight size={12} className="text-emerald-500 mt-0.5 shrink-0 opacity-60 group-hover/item:opacity-100 transition-opacity" />
                        <p className="text-[11px] text-zinc-400 font-medium leading-tight">{p.descricao}</p>
                     </div>
                   ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-5 opacity-60">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4A5568]">
                  {event.type}
                </span>
                <span className="size-1 rounded-full bg-[#23272F]" />
                <span className="text-[9px] text-[#4A5568] font-bold tabular-nums">
                  {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
