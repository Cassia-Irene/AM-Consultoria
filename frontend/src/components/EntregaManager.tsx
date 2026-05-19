'use client'

import React, { useState, useEffect } from 'react'
import { EntregasService } from '@/services/entregas.service'
import { type Entrega } from '@/domain/entrega'
import { type EntregaRaw } from '@/types/entrega.raw'
import { CheckCircle2, Circle, Calendar, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import { displayDate } from '@/utils/date'

function isUrl(str: string): boolean {
  try {
    const trimmed = (str || '').trim()
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.')
  } catch {
    return false
  }
}

interface EntregaManagerProps {
  id?: string | number
  projetoId?: string | number
  onUpdate?: () => void
}

export function EntregaManager({ id, projetoId, onUpdate }: EntregaManagerProps) {
  const [entrega, setEntrega] = useState<Entrega | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(!id)

  // Form states
  const [descricao, setDescricao] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [referenciaDoc, setReferenciaDoc] = useState('')
  const [dataEntregaReal, setDataEntregaReal] = useState('')

  const loadEntrega = React.useCallback(async () => {
    if (!id) return
    setLoading(true)
    const data = await EntregasService.getById(id)
    if (data) {
      setEntrega({
        id: String(data.id_entrega),
        projetoId: String(data.id_projeto),
        descricao: data.descricao,
        data_entrega_prevista: data.data_entrega_prevista,
        data_entrega_real: data.data_entrega_real || undefined,
        entregue: data.entregue,
        referencia_doc: data.referencia_doc || undefined
      })
      setDescricao(data.descricao)
      setDataPrevista(data.data_entrega_prevista.split('T')[0])
      setReferenciaDoc(data.referencia_doc || '')
      setDataEntregaReal(data.data_entrega_real ? data.data_entrega_real.split('T')[0] : '')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    Promise.resolve().then(() => loadEntrega())
  }, [loadEntrega])

  async function handleToggleStatus() {
    if (!entrega) return
    setSaving(true)
    try {
      const newStatus = !entrega.entregue
      const updateData: Partial<EntregaRaw> = {
        entregue: newStatus,
        data_entrega_real: newStatus ? new Date().toISOString().split('T')[0] : null
      }
      await EntregasService.update(Number(entrega.id), updateData)
      await loadEntrega()
      onUpdate?.()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload: Partial<EntregaRaw> = {
        descricao,
        data_entrega_prevista: dataPrevista,
        referencia_doc: referenciaDoc || null,
        data_entrega_real: dataEntregaReal || null
      }

      if (id) {
        payload.entregue = !!dataEntregaReal
        await EntregasService.update(Number(id), payload)
        setEditMode(false)
        await loadEntrega()
        onUpdate?.()
      } else if (projetoId) {
        payload.id_projeto = Number(projetoId)
        payload.entregue = !!dataEntregaReal
        await EntregasService.create(payload)
        onUpdate?.()
      }
    } catch (err) {
      console.error('Erro ao salvar entrega:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="size-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando Marco...</span>
    </div>
  )

  const isLate = !entrega?.entregue && entrega?.data_entrega_prevista && new Date(entrega.data_entrega_prevista) < new Date()
  const delayDays = isLate ? Math.floor((new Date().getTime() - new Date(entrega!.data_entrega_prevista).getTime()) / (1000 * 3600 * 24)) : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER / STATUS */}
      {!editMode && entrega && (
        <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleToggleStatus}
              disabled={saving}
              className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                entrega.entregue 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                  : 'bg-zinc-800 text-zinc-500 hover:text-emerald-500 border border-zinc-700'
              }`}
            >
              {entrega.entregue ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <div>
              <p className="text-white font-bold text-sm">
                {entrega.entregue ? 'Marco Concluído' : 'Aguardando Entrega'}
              </p>
              <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                {entrega.entregue ? `Entregue em ${displayDate(entrega.data_entrega_real!)}` : 'Operação Pendente'}
              </p>
            </div>
          </div>
          
          {isLate && (
            <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-500" />
              <span className="text-rose-500 text-[10px] font-black uppercase">
                {delayDays}d de Atraso
              </span>
            </div>
          )}
        </div>
      )}

      {/* FORM / VIEW */}
      <div className="bg-[#0d1117] border border-zinc-800 rounded-3xl p-6 space-y-6">
        {editMode ? (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Descrição do Marco</label>
              <textarea 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Entrega do dpssiê técnico final..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 outline-none transition-all min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Previsão</label>
                <input 
                  type="date"
                  value={dataPrevista}
                  onChange={(e) => setDataPrevista(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Ref. Documental</label>
                <input 
                  type="text"
                  value={referenciaDoc}
                  onChange={(e) => setReferenciaDoc(e.target.value)}
                  placeholder="Ex: Google Drive / PDF"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Conclusão Real (Opcional - Lançar data conclui o marco)</label>
              <input 
                type="date"
                value={dataEntregaReal}
                onChange={(e) => setDataEntregaReal(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 outline-none"
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={saving || !descricao || !dataPrevista}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-xl shadow-emerald-950/20"
            >
              {saving ? 'Salvando...' : id ? 'Salvar Alterações' : 'Criar Marco de Entrega'}
            </button>
            
            {id && (
              <button 
                onClick={() => setEditMode(false)}
                className="w-full text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            )}
          </>
        ) : entrega && (
          <>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Escopo da Entrega</p>
                <h3 className="text-white text-lg font-bold leading-tight">{entrega.descricao}</h3>
              </div>
              <button 
                onClick={() => setEditMode(true)}
                className="text-[10px] font-black uppercase tracking-widest text-sky-500 hover:text-white transition-colors"
              >
                Editar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-200 mb-1">Previsão Original</p>
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
                  <Calendar size={12} className="text-emerald-500" />
                  {displayDate(entrega.data_entrega_prevista)}
                </div>
              </div>
              <div className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-200 mb-1">Documentação</p>
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold truncate">
                  <LinkIcon size={12} className="text-emerald-500 shrink-0" />
                  {entrega.referencia_doc ? (
                    isUrl(entrega.referencia_doc) ? (
                      <a 
                        href={entrega.referencia_doc.startsWith('www.') ? `https://${entrega.referencia_doc}` : entrega.referencia_doc} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="truncate text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                      >
                        {entrega.referencia_doc}
                      </a>
                    ) : (
                      <span className="truncate">{entrega.referencia_doc}</span>
                    )
                  ) : (
                    <span className="truncate text-zinc-500 italic">Sem referência</span>
                  )}
                </div>
              </div>
            </div>

            {!entrega.entregue && (
              <div className="pt-4">
                <button 
                  onClick={handleToggleStatus}
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
                >
                  <CheckCircle2 size={18} />
                  Concluir este Marco
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER / TIPS */}
      <div className="px-2">
        <p className="text-zinc-300 text-[10px] leading-relaxed italic">
          As entregas são marcos contratuais. Concluir um marco atualiza automaticamente o progresso do projeto e a saúde operacional do cliente.
        </p>
      </div>
    </div>
  )
}
