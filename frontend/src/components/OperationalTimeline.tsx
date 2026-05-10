import React from 'react'

interface TimelineEvent {
  date: string
  type: string
  title: string
  subtitle: string
  critical: boolean
}

export function OperationalTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-[#23272F]">
      {events.map((event, idx) => (
        <div key={idx} className="relative pl-8">
          {/* Dot */}
          <div className={`absolute left-0 top-1.5 size-[24px] rounded-full border-4 border-[#07090D] flex items-center justify-center ${
            event.critical ? 'bg-red-500' : 'bg-[#23272F]'
          }`}>
            <div className={`size-2 rounded-full ${event.critical ? 'bg-white' : 'bg-[#7D8597]'}`} />
          </div>
          
          {/* Content */}
          <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-3">
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                event.critical ? 'bg-red-900/40 text-red-400' : 'bg-[#23272F] text-[#7D8597]'
              }`}>
                {event.subtitle}
              </span>
              <span className="text-[10px] tabular-nums text-[#7D8597]">
                {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <h4 className="text-white text-sm font-bold leading-tight">{event.title}</h4>
            <p className="text-[#7D8597] text-[11px] mt-0.5 capitalize">
              {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
