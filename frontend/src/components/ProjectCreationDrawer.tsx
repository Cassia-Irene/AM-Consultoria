'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { ContratoService } from '@/services/contrato.service'
import { ProjetosService } from '@/services/projetos.service'
import { ClientesService } from '@/services/clientes.service'
import type { Contrato } from '@/domain/contrato'
import type { Cliente } from '@/domain/cliente'

import type { ProjetoRaw } from '@/types/projeto.raw'

interface ProjectCreationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (id: string) => void
}

export function ProjectCreationDrawer({ isOpen, onClose, onSuccess }: ProjectCreationDrawerProps) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    id_contrato: '',
    titulo: '',
    descricao: '',
    valor_total: '',
    data_inicio: new Date().toISOString().split('T')[0],
    status: 'em andamento'
  })

  const loadInitialData = async () => {
    try {
      const [cont, clis] = await Promise.all([
        ContratoService.getAll(),
        ClientesService.getAll()
      ])
      setContratos(cont)
      setClientes(clis)
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err)
      setError('Falha ao carregar contratos/clientes.')
    }
  }

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => loadInitialData())
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.id_contrato || !form.titulo || !form.valor_total || !form.data_inicio) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload: Partial<ProjetoRaw> = {
        id_contrato: Number(form.id_contrato),
        titulo: form.titulo,
        descricao: form.descricao || null,
        valor_total: Number(form.valor_total),
        status: form.status,
        data_inicio: form.data_inicio
      }

      const novo = await ProjetosService.create(payload)
      onSuccess(novo.id)
      onClose()
    } catch (err) {
      console.error('Erro ao criar projeto:', err)
      setError('Erro ao salvar projeto. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0A0D12] border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <header className="px-6 py-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-black tracking-tight">Novo Projeto</h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Nascimento Factual Mínimo</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Contrato / Cliente */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Contrato Vinculado *</label>
              <select 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                value={form.id_contrato}
                onChange={e => setForm({...form, id_contrato: e.target.value})}
                required
              >
                <option value="">Selecione o Contrato</option>
                {contratos.map(c => {
                  const cliente = clientes.find(cli => cli.id === c.clienteId)
                  return (
                    <option key={c.id} value={c.id}>
                      {cliente ? `${cliente.nome_instituicao} — ` : ''}{c.servicos_contratados}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome do Projeto *</label>
              <input 
                type="text"
                placeholder="Ex: Reestruturação Operacional 2024"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-700"
                value={form.titulo}
                onChange={e => setForm({...form, titulo: e.target.value})}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Descrição Breve</label>
              <textarea 
                placeholder="Objetivo principal desta fase..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-700"
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
                rows={3}
              />
            </div>

            {/* Financeiro e Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Investimento (R$) *</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                  value={form.valor_total}
                  onChange={e => setForm({...form, valor_total: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Início Factual *</label>
                <input 
                  type="date"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                  value={form.data_inicio}
                  onChange={e => setForm({...form, data_inicio: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Status Inicial */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Status Operacional</label>
              <select 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}
              >
                <option value="em andamento">Em Andamento</option>
                <option value="concluído">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-500 text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-zinc-800 bg-zinc-900/30">
          <button 
            type="submit"
            form="create-project-form"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
                <span>Registrar Operação</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
