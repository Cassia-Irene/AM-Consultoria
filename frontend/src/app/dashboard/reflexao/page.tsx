'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { AnalyticsService, type OperationalInsight, type ClientHealth } from '@/services/analytics.service'
import { OperationalTimeline } from '@/components/OperationalTimeline'
import { DashboardTabs } from '@/components/DashboardTabs'
import { OperationalDrawer } from '@/components/OperationalDrawer'
import { VisitaDetailView } from '@/components/VisitaDetailView'
import { PendenciaManager } from '@/components/PendenciaManager'

/* ─────────────────────────────────────────────
   COMPONENTES MODO REFLEXÃO
───────────────────────────────────────────── */

function InsightCard({ 
  label, 
  value, 
  description, 
  accent = 'blue' 
}: { 
  label: string; 
  value: string | number; 
  description: string;
  accent?: 'blue' | 'red' | 'amber'
}) {
  const colors = {
    blue:  'text-sky-400',
    red:   'text-red-400',
    amber: 'text-amber-400'
  }
  
  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-3xl p-5 sm:p-6 shadow-lg">
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#7D8597] mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black ${colors[accent]}`}>{value}</p>
      <p className="text-[11px] sm:text-xs text-[#7D8597] mt-2 leading-relaxed">{description}</p>
    </div>
  )
}

function ClientHealthRow({ health }: { health: ClientHealth }) {
  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-white font-bold text-sm truncate">{health.cliente}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex-1 h-1.5 bg-[#23272F] rounded-full overflow-hidden max-w-[120px]">
            <div 
              className={`h-full ${health.indiceDesgaste > 70 ? 'bg-red-500' : 'bg-sky-500'}`} 
              style={{ width: `${health.indiceDesgaste}%` }} 
            />
          </div>
          <span className={`text-[10px] font-bold ${health.indiceDesgaste > 70 ? 'text-red-400' : 'text-sky-400'}`}>
            {health.indiceDesgaste}% de esforço
          </span>
        </div>
      </div>
      <div className="text-right ml-4">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#7D8597] bg-[#23272F] px-2 py-1 rounded">
          {health.perfil.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}


export default function ModoReflexaoPage() {
  const [data, setData] = useState<OperationalInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: number | string } | null>(null)

  const loadData = useCallback(() => {
    AnalyticsService.getOperationalSnapshot().then(res => {
      setData(res)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const timelineEvents = useMemo(() => {
    if (!data) return []
    return AnalyticsService.getOperationalTimeline(data).slice(0, 15)
  }, [data])

  if (loading || !data) return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
      <span className="text-sky-500 animate-pulse font-black tracking-widest text-xs uppercase">Analisando Operação...</span>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#07090D] pb-32">
      <DashboardTabs />

      <div className="px-6 pt-8 space-y-10">
        
        {/* SEÇÃO 1: OS INVISÍVEIS */}
        <section>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7D8597] mb-4 px-1">Carga Invisível</p>
          <div className="grid grid-cols-1 gap-4">
            <InsightCard 
              label="Esforço Não Faturado" 
              value={`~${Math.round(data.totalHorasInvisiveis / 60)}h`}
              description="Estimativa de tempo gasto em acionamentos rápidos, orientações remotas e suportes fora de contrato neste mês."
              accent="amber"
            />
            <InsightCard 
              label="Frequência de Caos" 
              value={data.urgenciasNoMes}
              description="Número de vezes que a rotina foi quebrada por demandas emergenciais ou críticas."
              accent="red"
            />
          </div>
        </section>

        {/* SEÇÃO 2: DIAGNÓSTICO OPERACIONAL */}
        <section>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7D8597] mb-4 px-1">Saúde dos Contratos</p>
          <div className="space-y-3">
            {data.topDrainingClients.map(health => (
              <ClientHealthRow 
                key={health.idContrato} 
                health={health} 
              />
            ))}
          </div>
        </section>

        {/* SEÇÃO 3: TIMELINE VIVA */}
        <section>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7D8597] mb-4 px-1">Memória Operacional</p>
          <div className="bg-[#0d1117] border border-[#23272F] rounded-3xl p-6 shadow-xl">
            <OperationalTimeline 
              events={timelineEvents} 
              onEventClick={(ev) => {
                if (ev.idReferencia) {
                  setSelectedItem({ type: ev.type, id: ev.idReferencia })
                }
              }}
            />
          </div>
        </section>

      </div>

      {/* DRAWER DE DETALHES (Consistência com Planejamento) */}
      <OperationalDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.type === 'visita' ? 'Gestão de Visita' : 'Gestão de Pendência'}
      >
        {selectedItem?.type === 'pendencia' ? (
          <PendenciaManager 
            id={selectedItem.id} 
            onUpdate={loadData} 
          />
        ) : selectedItem?.type === 'visita' ? (
          <VisitaDetailView id={selectedItem.id as number} />
        ) : (
          <div className="text-center py-10">
            <p className="text-zinc-600 text-xs italic">Selecione um item para operar.</p>
          </div>
        )}
      </OperationalDrawer>

      <footer className="mt-12 px-10 text-center pb-20">
        <p className="text-[#4F5B73] text-[11px] leading-relaxed">
          Este modo foi desenhado para ser uma leitura silenciosa da operação humana da AM Consultoria.
        </p>
      </footer>
    </main>
  )
}
