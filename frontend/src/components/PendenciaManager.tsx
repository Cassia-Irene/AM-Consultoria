'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PendenciasService } from '@/services/pendencias.service'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { getPendenciaSeveridade, getPendenciaStatus } from '@/utils/pendencia'
import { displayDate } from '@/utils/date'
import type { Pendencia } from '@/domain/pendencia'
import Link from 'next/link'

interface PendenciaManagerProps {
  id: string | number
  onUpdate?: () => void
  highlightColor?: 'amber' | 'zinc' | 'red'
}

export function PendenciaManager({ id, onUpdate, highlightColor = 'red' }: PendenciaManagerProps) {
  const [pendencia, setPendencia] = useState<Pendencia | null>(null)
  const [clienteNome, setClienteNome] = useState('...')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Pendencia>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const p = await PendenciasService.getById(String(id))
      setPendencia(p)
      setForm(p)

      // Buscar nome do cliente via contrato
      const allCont = await ContratoService.getAll()
      const contrato = allCont.find(c => c.id === p.contratoId)
      if (contrato) {
        const allCli = await ClientesService.getAll()
        const cliente = allCli.find(c => c.id === contrato.clienteId)
        if (cliente) setClienteNome(cliente.nome_instituicao)
      }
    } catch (err) {
      console.error('Erro ao carregar pendência:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    Promise.resolve().then(() => loadData())
  }, [loadData])

  async function handleToggleResolve() {
    if (!pendencia) return
    try {
      await PendenciasService.atualizar(String(id), { resolvida: !pendencia.resolvida })
      loadData()
      onUpdate?.()
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  async function handleSave() {
    try {
      await PendenciasService.atualizar(String(id), {
        descricao: form.descricao,
        responsavel: form.responsavel,
        data_prazo: form.data_prazo
      })
      setEditing(false)
      loadData()
      onUpdate?.()
    } catch {
      alert('Erro ao salvar alterações')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="size-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Sincronizando Fatos...</p>
    </div>
  )

  if (!pendencia) return <p className="text-zinc-500 text-center py-10">Pendência não encontrada.</p>

  const status = getPendenciaStatus(pendencia)
  const severidade = getPendenciaSeveridade(pendencia)

  const badges = {
    concluida: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    aberta: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    atrasada: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const severities = {
    urgente: 'bg-red-500 text-white',
    atencao: 'bg-amber-500 text-black',
    normal: 'bg-zinc-800 text-zinc-400',
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* HEADER OPERACIONAL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${badges[status]}`}>
            {status}
          </span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${severities[severidade]}`}>
            {severidade}
          </span>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Descrição do Fato</p>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-sky-500 text-[10px] font-bold hover:underline">Editar</button>
            )}
          </div>
          
          {editing ? (
            <textarea 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              value={form.descricao}
              onChange={e => setForm({...form, descricao: e.target.value})}
              rows={4}
            />
          ) : (
            <p className="text-zinc-200 text-sm leading-relaxed font-medium">{pendencia.descricao}</p>
          )}
        </div>
      </section>

      {/* METADADOS RÍGIDOS */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Instituição</p>
          <p className="text-zinc-300 text-xs font-bold truncate">{clienteNome}</p>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Responsável</p>
          {editing ? (
            <select 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
              value={form.responsavel}
              onChange={e => setForm({...form, responsavel: e.target.value})}
            >
              <option value="Equipe Cliente">Equipe Cliente</option>
              <option value="AM Consultoria">AM Consultoria</option>
            </select>
          ) : (
            <p className="text-zinc-300 text-xs font-bold">{pendencia.responsavel}</p>
          )}
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Prazo Final</p>
          {editing ? (
            <input 
              type="date"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
              value={form.data_prazo ? form.data_prazo.split('T')[0] : ''}
              onChange={e => setForm({...form, data_prazo: e.target.value})}
            />
          ) : (
            <p className="text-zinc-300 text-xs font-bold">{pendencia.data_prazo ? displayDate(pendencia.data_prazo) : 'Sem prazo'}</p>
          )}
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Origem</p>
          <p className="text-zinc-500 text-xs font-medium">{displayDate(pendencia.data_origem)}</p>
        </div>
      </section>

      {/* HISTÓRICO E CONTEXTO (SIMULADO) */}
      <section className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-1">Rastro Operacional</p>
        <div className="border-l-2 border-zinc-800 ml-2 pl-6 space-y-6">
           <div className="relative">
              <div className="absolute left-[-31px] top-1 size-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
              <p className="text-[10px] text-zinc-500 font-bold mb-1">Criação do Fato</p>
              <p className="text-xs text-zinc-400">Identificado durante visita de rotina técnica.</p>
           </div>
           {pendencia.resolvida && (
             <div className="relative">
                <div className="absolute left-[-31px] top-1 size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] text-emerald-500 font-bold mb-1">Resolução</p>
                <p className="text-xs text-zinc-400">Item marcado como concluído pelo operador.</p>
             </div>
           )}
        </div>
      </section>

      {/* AÇÕES DE RODAPÉ */}
      <div className="pt-6 border-t border-zinc-800 space-y-3">
        {editing ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setEditing(false)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 rounded-xl transition-colors"
            >
              Descartar
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-3 rounded-xl transition-colors"
            >
              Salvar Fato
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={handleToggleResolve}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                pendencia.resolvida 
                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
              }`}
            >
              {pendencia.resolvida ? 'Reabrir Pendência' : 'Concluir Agora'}
            </button>
            
            <Link 
              href={`/pendencias?id=${id}&highlight=${highlightColor}`}
              className="block w-full py-3 rounded-xl text-center text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Expandir para Tela Completa ↗
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
