'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { ContratoService } from '@/services/contrato.service'
import { ProjetosService } from '@/services/projetos.service'
import { ClientesService } from '@/services/clientes.service'
import { ContatosService } from '@/services/contatos.service'
import { fetchApi } from '@/services/api'
import type { Contrato } from '@/domain/contrato'
import type { Cliente } from '@/domain/cliente'
import type { Contato } from '@/domain/contato'

import type { ProjetoRaw } from '@/types/projeto.raw'

interface ProjectCreationDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (id: string) => void
}

export function ProjectCreationDrawer({ isOpen, onClose, onSuccess }: ProjectCreationDrawerProps) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    id_contrato: '',
    titulo: '',
    descricao: '',
    valor_total: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim_prevista: '',
    status: 'em andamento',
    is_extra: false,
    solicitado_por: ''
  })

  const loadInitialData = async () => {
    try {
      const [cont, clis, conts] = await Promise.all([
        ContratoService.getAll(),
        ClientesService.getAll(),
        ContatosService.getAll()
      ])
      setContratos(cont)
      setClientes(clis)
      setContatos(conts)
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

    if (form.is_extra && !form.solicitado_por) {
      setError('Selecione o solicitante para o projeto extra.')
      return
    }

    if (form.data_fim_prevista && form.data_fim_prevista < form.data_inicio) {
      setError('A previsão de fim não pode ser anterior ao início factual.')
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
        data_inicio: form.data_inicio,
        data_fim_prevista: form.data_fim_prevista || null
      }

      const novo = await ProjetosService.create(payload)

      // Se for extra, cria o vinculo operacional extra
      if (form.is_extra && form.solicitado_por) {
        await fetchApi('/projetos-extra/', {
          method: 'POST',
          body: JSON.stringify({
            id_projeto: Number(novo.id),
            solicitado_por: Number(form.solicitado_por)
          })
        }).catch(err => {
           console.error('Aviso: Projeto criado, mas falhou ao marcar como extra', err)
        })
      }

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
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Contrato Vinculado *</label>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Nome do Projeto *</label>
              <input 
                type="text"
                placeholder="Ex: Reestruturação Operacional 2024"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-400"
                value={form.titulo}
                onChange={e => setForm({...form, titulo: e.target.value})}
                required
              />
            </div>

            {/* Classificação Operacional (Projeto Extra) */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
               <div className="flex items-center justify-between">
                 <div>
                   <label className="text-sm font-bold text-white block mb-0.5">Projeto Extra</label>
                   <span className="text-[11px] font-medium text-sky-500">Trabalho paralelo além do escopo base</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => setForm({...form, is_extra: !form.is_extra})}
                   className={`w-11 h-6 rounded-full flex items-center transition-colors px-1 ${form.is_extra ? 'bg-sky-500' : 'bg-zinc-800'}`}
                 >
                   <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.is_extra ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
               </div>

               {form.is_extra && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                   <label className="text-[10px] font-black uppercase tracking-widest text-sky-500 ml-1">Solicitado Por *</label>
                   <select 
                     className="w-full bg-zinc-950 border border-sky-500/20 rounded-xl px-4 py-3 text-sm text-sky-100 focus:outline-none focus:border-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     value={form.solicitado_por}
                     onChange={e => setForm({...form, solicitado_por: e.target.value})}
                     required={form.is_extra}
                     disabled={!form.id_contrato}
                   >
                     <option value="">
                       {!form.id_contrato ? 'Selecione um contrato primeiro...' : 'Selecione a origem da demanda...'}
                     </option>
                     {form.id_contrato && contatos
                       .filter(c => String(c.clienteId) === String(contratos.find(cont => String(cont.id) === form.id_contrato)?.clienteId))
                       .map(c => (
                         <option key={c.id} value={c.id}>{c.nome} ({c.cargo || 'Sem Cargo'})</option>
                       ))
                     }
                   </select>
                 </div>
               )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Descrição Breve</label>
              <textarea 
                placeholder="Objetivo principal desta fase..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-400"
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
                rows={3}
              />
            </div>

            {/* Financeiro e Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Investimento (R$) *</label>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Início Factual *</label>
                <input 
                  type="date"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                  value={form.data_inicio}
                  onChange={e => setForm({...form, data_inicio: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Entrega Prevista</label>
               <input 
                 type="date"
                 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                 value={form.data_fim_prevista}
                 onChange={e => setForm({...form, data_fim_prevista: e.target.value})}
               />
               <p className="text-sky-600 text-[11px] px-1 font-medium italic">Opcional, mas fundamental para projeção de atrasos e saúde do backlog.</p>
            </div>

            {/* Status Inicial */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 ml-1">Status Operacional</label>
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
