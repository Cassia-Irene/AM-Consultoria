import React from 'react'

export interface TimelinePendencia {
  id: string
  descricao: string
  data_prazo: string
}

export interface TimelineEvent {
  id: string
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
    if (critical) return { color: 'bg-red-500', icon: '!' }
    switch (type.toLowerCase()) {
      case 'visita': return { color: 'bg-sky-500', icon: '📍' }
      case 'pendencia': return { color: 'bg-emerald-500', icon: '✓' }
      case 'financeiro': return { color: 'bg-amber-500', icon: '$' }
      default: return { color: 'bg-zinc-600', icon: '•' }
    }
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-[#23272F]">
      {events.map((event) => {
        const { color, icon } = getTypeStyles(event.type, event.critical)
        return (
          <div key={event.id} className="relative pl-10">
            {/* Dot/Icon */}
            <div className={`absolute left-0 top-1 size-[32px] rounded-full border-4 border-[#07090D] flex items-center justify-center shadow-lg ${color}`}>
              <span className="text-[10px] font-black text-white">{icon}</span>
            </div>
            
            {/* Content Card */}
            <div 
              onClick={() => onEventClick?.(event)}
              className={`group bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-4 transition-all ${
                onEventClick ? 'cursor-pointer hover:border-[#0466C8]/40 hover:bg-[#0d1117]/80' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  event.critical ? 'bg-red-900/40 text-red-400' : 'bg-[#23272F] text-[#7D8597]'
                }`}>
                  {event.subtitle}
                </span>
                <span className="text-[10px] font-bold tabular-nums text-[#4A5568]">
                  {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              
              <h4 className="text-white text-sm font-bold leading-snug group-hover:text-[#0466C8] transition-colors">
                {event.title}
              </h4>

              {/* Inline Pendencies (Point D) */}
              {event.pendencias && event.pendencias.length > 0 && (
                <div className="mt-4 space-y-2 pt-3 border-t border-[#23272F]/50">
                   <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Ações Geradas</p>
                   {event.pendencias.map(p => (
                     <div key={p.id} className="flex items-start gap-2">
                        <span className="text-emerald-500 text-[10px] mt-0.5">↳</span>
                        <p className="text-[11px] text-zinc-400 font-medium leading-tight">{p.descricao}</p>
                     </div>
                   ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 opacity-60">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#4A5568]">
                  {event.type}
                </span>
                <span className="size-1 rounded-full bg-[#23272F]" />
                <span className="text-[9px] text-[#4A5568] font-medium">
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
