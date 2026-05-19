import Link from 'next/link'
import { useState } from 'react'

export interface CardEvent {
  cliente: string
  data?: string
  dataHora?: string
  idContrato: number
  statusPagamento?: string
  pendenciasContagem?: number
  ultimaVisitaResultados?: string
  pendenciasLista?: { id: number; descricao: string; dataPrazo?: string }[]
  tipoVisita?: string
  modalidade?: string
  idVisita?: number
}

function labelPrazo(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0,0,0,0)
  d.setHours(0,0,0,0)
  
  const diff = d.getTime() - today.getTime()
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return days === -1 ? 'ontem' : `${Math.abs(days)}d atrás`
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${days}d`
}

export function VisitaRotinaCard({ event, compact = false }: { event: CardEvent; compact?: boolean }) {
  const [expanded, setExpanded] = useState(!compact)

  const statusPagamento = event.statusPagamento
  const pendenciasCount = event.pendenciasContagem || 0
  const ultimaVisita = event.ultimaVisitaResultados
  const data = event.data || event.dataHora || ''



  return (
    <div 
      onClick={() => compact && setExpanded(!expanded)}
      className={`bg-[#001845] border border-[#002855] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${compact ? 'cursor-pointer hover:border-sky-500/30' : ''}`}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`size-1.5 rounded-full ${labelPrazo(data) === 'hoje' ? 'bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]' : 'bg-zinc-500'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${labelPrazo(data) === 'hoje' ? 'text-sky-400' : 'text-zinc-500'}`}>
              {labelPrazo(data)}
            </span>
          </div>
          <h3 className={`text-white font-black leading-tight tracking-tight truncate ${compact ? 'text-[15px]' : 'text-[17px]'}`}>{event.cliente}</h3>
          <p className="text-[#7D8597] text-[10px] font-bold mt-0.5">
            {new Date(data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </p>

        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {statusPagamento && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              statusPagamento === 'pago' ? 'bg-[#064e3b] text-[#10b981]' : 'bg-[#78350f] text-[#f59e0b]'
            }`}>
              {statusPagamento === 'pago' ? '✓ Pago' : '$ Pendente'}
            </span>
          )}
          {pendenciasCount > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#450a0a] text-[#ef4444] border border-red-900/30">
              {pendenciasCount} em aberto
            </span>
          )}
          {compact && (
             <span className={`text-[10px] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
               ▼
             </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">

      {ultimaVisita && (
        <div className="mx-4 mb-4 p-3.5 bg-black/30 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-sky-400/70">Última Visita</span>
          </div>
          <p className="text-zinc-300 text-[11px] leading-relaxed italic line-clamp-3">
            &quot;{ultimaVisita}&quot;
          </p>
        </div>
      )}

      {/* Lista de Pendências em Aberto */}
      {event.pendenciasLista && event.pendenciasLista.length > 0 && (
        <div className="mx-4 mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#7D8597] mb-3">
            Em Aberto ({event.pendenciasLista.length})
          </p>
          <div className="space-y-2.5">
            {event.pendenciasLista.map((p: { id: number; descricao: string; dataPrazo?: string }, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3 group">

                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-1 rounded-full bg-zinc-600 group-hover:bg-sky-500 transition-colors" />
                  <p className="text-zinc-400 text-[12px] font-medium truncate">{p.descricao}</p>
                </div>
                {p.dataPrazo && (
                  <span className="text-[10px] font-bold text-zinc-500 shrink-0 tabular-nums">
                    {labelPrazo(p.dataPrazo)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

        <div className="px-4 pb-4">
          <Link 
            href={`/visitas/nova?contratoId=${event.idContrato}&tipo=${encodeURIComponent(event.tipoVisita || '')}&modalidade=${encodeURIComponent(event.modalidade || '')}&dataHora=${encodeURIComponent(event.dataHora || '')}&agendadaId=${event.idVisita || ''}`} 
            className="block" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0466C8] hover:bg-[#0353A4] active:scale-[0.98] transition-all text-white text-[12px] font-black text-center rounded-xl py-3 shadow-lg shadow-blue-900/30 uppercase tracking-widest">
              Registrar visita
            </div>
          </Link>
        </div>
        </div>
      )}
    </div>
  )
}
