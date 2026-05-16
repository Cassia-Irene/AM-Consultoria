'use client'

import React, { useState } from 'react'
import { Plus, CheckCircle, Circle, Trash2, Calendar, FileText } from 'lucide-react'
import { EntregasService, EntregaRaw } from '@/services/entregas.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  projetoId: string
  entregas: EntregaRaw[]
  onUpdate: () => void
}

export function ProjectBacklogManager({ projetoId, entregas, onUpdate }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const handleAdd = async () => {
    if (!newDesc) return
    try {
      await EntregasService.create({
        id_projeto: parseInt(projetoId),
        descricao: newDesc,
        data_entrega_prevista: newDate,
        entregue: false
      })
      setNewDesc('')
      setIsAdding(false)
      onUpdate()
    } catch (err) {
      console.error('Erro ao adicionar entrega:', err)
    }
  }

  const toggleStatus = async (entrega: EntregaRaw) => {
    try {
      await EntregasService.update(entrega.id_entrega, {
        entregue: !entrega.entregue,
        data_entrega_real: !entrega.entregue ? format(new Date(), 'yyyy-MM-dd') : null
      })
      onUpdate()
    } catch (err) {
      console.error('Erro ao atualizar entrega:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta entrega?')) return
    try {
      await EntregasService.delete(id)
      onUpdate()
    } catch (err) {
      console.error('Erro ao excluir entrega:', err)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Backlog Operacional
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-white/10 rounded-xl space-y-4 animate-in slide-in-from-top duration-300">
          <input
            autoFocus
            type="text"
            placeholder="O que precisa ser entregue?"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-white/40 uppercase mb-1 block">Prazo</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-white"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {entregas.length === 0 ? (
          <div className="text-center py-8 text-white/30 border-2 border-dashed border-white/5 rounded-xl">
            Nenhuma entrega no backlog
          </div>
        ) : (
          entregas
            .sort((a, b) => new Date(a.data_entrega_prevista).getTime() - new Date(b.data_entrega_prevista).getTime())
            .map((e) => (
            <div
              key={e.id_entrega}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                e.entregue 
                  ? 'bg-green-500/5 border-green-500/20 text-white/40' 
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleStatus(e)}
                  className={`p-1 rounded-full transition-colors ${
                    e.entregue ? 'text-green-500' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  {e.entregue ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div>
                  <p className={`font-medium ${e.entregue ? 'line-through' : ''}`}>
                    {e.descricao}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(e.data_entrega_prevista), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                    {e.data_entrega_real && (
                      <span className="text-green-500/60 italic">
                        Concluído em {format(new Date(e.data_entrega_real), "dd/MM")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(e.id_entrega)}
                className="p-2 text-white/0 group-hover:text-red-400/60 hover:text-red-400 transition-all rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
