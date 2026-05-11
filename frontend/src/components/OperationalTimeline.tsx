import React from 'react'

interface TimelineEvent {
  date: string
  type: string
  title: string
  subtitle: string
  critical: boolean
}

export function OperationalTimeline({ events }: { events: TimelineEvent[] }) {
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
      {events.map((event, idx) => {
        const { color, icon } = getTypeStyles(event.type, event.critical)
        return (
          <div key={idx} className="relative pl-10">
            {/* Dot/Icon */}
            <div className={`absolute left-0 top-1 size-[32px] rounded-full border-4 border-[#07090D] flex items-center justify-center shadow-lg ${color}`}>
              <span className="text-[10px] font-black text-white">{icon}</span>
            </div>
            
            {/* Content */}
            <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-4 hover:border-[#23272F]/80 transition-colors">
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
              <h4 className="text-white text-sm font-bold leading-snug">{event.title}</h4>
              <div className="flex items-center gap-2 mt-2">
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
