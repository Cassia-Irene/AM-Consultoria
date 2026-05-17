'use client'
// src/components/ContratoTimeline.tsx

import { useState } from 'react'
import type { Contrato, HistoricoContrato } from '@/domain/contrato'
import { buildContratoTimeline } from '@/utils/contratoTimeline'

type Props = {
  contratos: Contrato[]
  historicos: HistoricoContrato[]
  contratoId: string
}

export function ContratoTimeline({ contratos, historicos, contratoId }: Props) {
  const items = buildContratoTimeline(contratos, historicos, contratoId)
  const [selectedDiff, setSelectedDiff] = useState<{ de: Contrato; para: Contrato } | null>(null)

  function handleVerDiff(h: { contratoEncerradoId: string; contratoNovoId: string }) {
    const de = contratos.find(c => c.id === h.contratoEncerradoId)
    const para = contratos.find(c => c.id === h.contratoNovoId)
    if (de && para) {
      setSelectedDiff({ de, para })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-0">
        {items.map((item, idx) => (
          <div key={`${item.type}-${idx}`} className="flex gap-4 group">
            {/* Linha e Ponto */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 border-[#07090D] shadow-sm shrink-0 z-10 ${
                item.type === 'criacao' ? 'bg-sky-500' :
                item.type === 'substituicao' ? 'bg-amber-400' : 'bg-emerald-500'
              }`} />
              {idx !== items.length - 1 && (
                <div className="w-0.5 flex-1 bg-zinc-800/50 my-1" />
              )}
            </div>

            {/* Conteúdo */}
            <div className="pb-8 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-[10px] font-bold tabular-nums text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded-lg border border-zinc-800/30">
                  {new Date(item.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              {item.type === 'substituicao' && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-zinc-500 italic leading-relaxed">
                    &quot;{item.motivo}&quot;
                  </p>
                  <button 
                    onClick={() => handleVerDiff(item)}
                    className="text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-400 transition-colors flex items-center gap-1"
                  >
                    Ver alterações
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                </div>
              )}

              {item.type === 'criacao' && item.contratoId === contratoId && (
                <p className="text-[10px] text-sky-500/60 font-bold uppercase mt-1">Versão atual</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Seção de Diff (Condicional) */}
      {selectedDiff && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Comparativo de Versões</h3>
            <button onClick={() => setSelectedDiff(null)} className="text-zinc-600 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <ContratoDiff antigo={selectedDiff.de} novo={selectedDiff.para} />
        </div>
      )}
    </div>
  )
}

function ContratoDiff({ antigo, novo }: { antigo: Contrato; novo: Contrato }) {
  const fields = [
    { label: 'Serviços', key: 'servicos_contratados' },
    { label: 'Visitas Mensais', key: 'visitas_previstas_mes' },
    { label: 'Relatório', key: 'inclui_relatorio', formatter: (v: boolean | string | number | undefined | null) => v ? 'Incluso' : 'Não incluso' },
    { label: 'Status', key: 'status' },
  ]

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/50">
      <div className="grid grid-cols-2 bg-zinc-800/30 px-4 py-2 border-b border-zinc-800">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Versão Anterior ({antigo.id})</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">Nova Versão ({novo.id})</p>
      </div>
      {fields.map(f => {
        const valDe = (antigo as unknown as Record<string, string | number | boolean | undefined | null>)[f.key]
        const valPara = (novo as unknown as Record<string, string | number | boolean | undefined | null>)[f.key]
        const mudou = valDe !== valPara
        
        if (!mudou) return null

        return (
          <div key={f.key} className="grid grid-cols-2 px-4 py-3 gap-4 group hover:bg-zinc-800/20 transition-colors">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase text-zinc-600 mb-1">{f.label}</p>
              <p className="text-xs text-zinc-500 line-through truncate">
                {f.formatter ? f.formatter(valDe) : valDe}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase text-zinc-600 mb-1">{f.label}</p>
              <p className="text-xs text-emerald-400 font-bold truncate">
                {f.formatter ? f.formatter(valPara) : valPara}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
