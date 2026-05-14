'use client'

import React, { useState } from 'react'
import { type ClientHealth, type ActiveProject } from '@/services/analytics.service'
import { ProjectMarcoList } from './ProjectMarcoList'
import { ChevronDown, ChevronUp, Package, Layout } from 'lucide-react'

interface OperationalContractCardProps {
  health: ClientHealth
  allProjects: ActiveProject[]
  onEntregaClick?: (id: string | number) => void
  onAddEntrega?: (projetoId: string | number) => void
  refreshSignal?: number
}

export function OperationalContractCard({ 
  health, 
  allProjects, 
  onEntregaClick, 
  onAddEntrega,
  refreshSignal 
}: OperationalContractCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const contractProjects = allProjects.filter(p => p.idContrato === health.idContrato)

  const statusColors = {
    'emergência': 'text-rose-500',
    'atenção': 'text-amber-500',
    'normal': 'text-emerald-500'
  }
  
  const barColors = {
    'emergência': 'bg-rose-500',
    'atenção': 'bg-amber-500',
    'normal': 'bg-emerald-500'
  }

  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Contract Row (The "Saúde" row) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/20 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm truncate">{health.cliente}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-1.5 bg-[#23272F] rounded-full overflow-hidden max-w-[120px]">
              <div 
                className={`h-full transition-all duration-700 ${
                  health.entregasAtrasadas > 0 ? 'bg-rose-500' : barColors[health.statusOperacional]
                }`} 
                style={{ width: `${health.progressoMedio}%` }} 
              />
            </div>
            <span className={`text-[10px] font-bold ${statusColors[health.statusOperacional]}`}>
              {health.progressoMedio}% avanço
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-4">
          <div className="text-right">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#7D8597] bg-[#23272F] px-2 py-1 rounded">
              {health.statusOperacional}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-zinc-700" /> : <ChevronDown size={16} className="text-zinc-700" />}
        </div>
      </div>

      {/* Expanded Projects Area */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-zinc-800/50 bg-[#07090D]/50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-4 mt-2">
            <Layout size={10} className="text-zinc-600" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">Contexto de Projetos</p>
          </div>

          {contractProjects.length === 0 ? (
            <p className="text-[10px] text-zinc-700 italic ml-1">Nenhum projeto ativo para este contrato.</p>
          ) : (
            <div className="space-y-6">
              {contractProjects.map(proj => (
                <div key={proj.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package size={12} className="text-sky-500/50" />
                    <h5 className="text-zinc-200 text-xs font-bold">{proj.projeto}</h5>
                    <span className="text-[8px] font-black uppercase bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded leading-none">
                      {proj.status}
                    </span>
                  </div>
                  
                  {/* Inline Delivery List */}
                  <ProjectMarcoList 
                    projetoId={proj.id}
                    refreshSignal={refreshSignal}
                    onEntregaClick={onEntregaClick}
                    onAddEntrega={onAddEntrega}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
