import React from 'react'
import { CheckCircle2, AlertCircle, Zap, ShieldCheck, History } from 'lucide-react'

interface TimelineEvent {
  data: string
  tipo: 'entrega_concluida' | 'atraso_critico' | 'evento_critico' | 'governança'
  label: string
  impacto: 'positivo' | 'negativo' | 'neutro'
}

interface Props {
  events: TimelineEvent[]
}

export function ProjectTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-zinc-800 rounded-3xl">
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Nenhum evento operacional registrado.</p>
      </div>
    )
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrega_concluida': return <CheckCircle2 size={12} className="text-emerald-500" />
      case 'atraso_critico': return <AlertCircle size={12} className="text-rose-500" />
      case 'evento_critico': return <Zap size={12} className="text-amber-500" />
      case 'governança': return <ShieldCheck size={12} className="text-sky-500" />
      default: return <History size={12} className="text-zinc-500" />
    }
  }

  return (
    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
      {events.map((event, idx) => (
        <div key={idx} className="relative pl-8 group animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center z-10 group-hover:border-zinc-700 transition-colors">
            {getIcon(event.tipo)}
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[11px] text-zinc-300 font-bold group-hover:text-white transition-colors">{event.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                  {new Date(event.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`w-1 h-1 rounded-full ${
                  event.impacto === 'positivo' ? 'bg-emerald-500' : 
                  event.impacto === 'negativo' ? 'bg-rose-500' : 'bg-sky-500'
                }`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
