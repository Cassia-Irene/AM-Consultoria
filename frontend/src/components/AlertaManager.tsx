'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { EventosService, type EventoCritico } from '@/services/eventos.service'
import { ContratoService } from '@/services/contrato.service'
import { ClientesService } from '@/services/clientes.service'
import { displayDate } from '@/utils/date'

interface AlertaManagerProps {
  id: string | number
  onUpdate?: () => void
}

export function AlertaManager({ id, onUpdate }: AlertaManagerProps) {
  const [evento, setEvento] = useState<EventoCritico | null>(null)
  const [clienteNome, setClienteNome] = useState('...')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [acaoTomada, setAcaoTomada] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const all = await EventosService.getAll()
      const found = all.find(e => String(e.id_evento) === String(id))
      if (found) {
        setEvento(found)
        setAcaoTomada(found.acao_tomada || '')
        
        // Buscar nome do cliente via contrato
        const allCont = await ContratoService.getAll()
        const contrato = allCont.find(c => String(c.id) === String(found.id_contrato))
        if (contrato) {
          const allCli = await ClientesService.getAll()
          const cliente = allCli.find(c => c.id === contrato.clienteId)
          if (cliente) setClienteNome(cliente.nome_instituicao)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar evento crítico:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    Promise.resolve().then(() => loadData())
  }, [loadData])

  async function handleStabilize() {
    if (!evento || !evento.id_evento) return
    if (!acaoTomada.trim()) {
      alert('Por favor, descreva a ação mitigadora antes de estabilizar.')
      return
    }
    try {
      await EventosService.update(evento.id_evento, { acao_tomada: acaoTomada })
      setEditing(false)
      loadData()
      onUpdate?.()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar ação de estabilização')
    }
  }

  async function handleReopen() {
    if (!evento || !evento.id_evento) return
    try {
      await EventosService.update(evento.id_evento, { acao_tomada: '' })
      setEditing(true)
      loadData()
      onUpdate?.()
    } catch (err) {
      console.error(err)
      alert('Erro ao reabrir crise')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="size-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Sincronizando Fatos...</p>
    </div>
  )

  if (!evento) return <p className="text-zinc-500 text-center py-10">Alerta não encontrado.</p>

  const isResolvida = !!evento.acao_tomada && evento.acao_tomada.trim().length > 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* HEADER OPERACIONAL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
            isResolvida 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {isResolvida ? 'Estabilizada' : 'Crise Ativa'}
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-500 text-white">
            GRAVIDADE CRÍTICA
          </span>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
          <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-2">Descrição do Fato / Incidente</p>
          <p className="text-zinc-200 text-sm leading-relaxed font-medium">{evento.descricao}</p>
        </div>
      </section>

      {/* METADADOS RÍGIDOS */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2">Instituição / Contrato</p>
          <p className="text-zinc-200 text-xs font-bold truncate">{clienteNome}</p>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2">Data do Evento</p>
          <p className="text-zinc-200 text-xs font-bold">{displayDate(evento.data_evento)}</p>
        </div>
      </section>

      {/* AÇÃO MITIGADORA */}
      <section className="space-y-4">
        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 px-1">Ação de Contenção & Estabilização</p>
        
        {(!isResolvida || editing) ? (
          <div className="space-y-3">
            <textarea 
              className="w-full bg-zinc-900 border border-[#23272F] rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 outline-none transition-all min-h-[120px]"
              placeholder="Descreva quais ações mitigadoras foram tomadas para conter essa crise ou restaurar o goodwill do contrato..."
              value={acaoTomada}
              onChange={e => setAcaoTomada(e.target.value)}
            />
            {editing && (
              <button 
                onClick={() => setEditing(false)}
                className="text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 block px-1"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 relative group">
            <button 
              onClick={() => setEditing(true)} 
              className="absolute right-4 top-4 md:top-6 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold"
            >
              Editar Ação
            </button>
            <p className="text-emerald-400/90 text-sm leading-relaxed font-medium">{evento.acao_tomada}</p>
          </div>
        )}
      </section>

      {/* RASTRO OPERACIONAL DE ATENÇÃO */}
      <section className="space-y-4">
        <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 px-1">Rastro de Impacto</p>
        <div className="border-l-2 border-zinc-700 ml-2 pl-6 space-y-6">
           <div className="relative">
              <div className="absolute" />
              <p className="text-[10px] md:text-[14px] text-red-400 font-bold mb-1">Ruptura Operacional Detectada</p>
              <p className="text-[10px] md:text-[12px] text-zinc-200">Incidente registrado no sistema com impacto direto na estabilidade do cliente.</p>
           </div>
           {isResolvida && (
             <div className="relative">
                <div className="absolute" />
                <p className="text-[10px] md:text-[14px] text-emerald-400 font-bold mb-1">Crise Estabilizada</p>
                <p className="text-[10px] md:text-[12px] text-zinc-200">Plano de contenção cadastrado e saúde operacional em vias de recuperação.</p>
             </div>
           )}
        </div>
      </section>

      {/* AÇÕES DE SALVAMENTO / RESOLUÇÃO */}
      <div className="pt-6 border-t border-zinc-700">
        {(!isResolvida || editing) ? (
          <button 
            onClick={handleStabilize}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-950/30"
          >
            Estabilizar Crise e Salvar Ação
          </button>
        ) : (
          <button 
            onClick={handleReopen}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Reabrir Crise / Cancelar Estabilização
          </button>
        )}
      </div>

    </div>
  )
}
