'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { VisitasService, type NovaVisitaInput } from '@/services/visitas.service'
import { useLocalDraft } from '@/hooks/useLocalDraft'
import { RotateCcw, X } from 'lucide-react'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { TipoVisita } from '@/domain/visita'

export default function RegistroRapidoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [showDraftNotice, setShowDraftNotice] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('draft_visita_rapida')
    if (!saved) return false
    try {
      const draft = JSON.parse(saved)
      return !!(draft.clienteId || draft.descricao || draft.pendenciaRapida)
    } catch {
      return false
    }
  })

  // Form State via Local Draft
  const [form, setForm, clearDraft] = useLocalDraft('visita_rapida', {
    clienteId: '',
    tipoVisita: 'rotineira' as TipoVisita,
    descricao: '',
    pendenciaRapida: ''
  })

  const descartarDraft = () => {
    clearDraft()
    setShowDraftNotice(false)
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [cli, cont] = await Promise.all([
          ClientesService.getAll(),
          ContratoService.getAll()
        ])
        setClientes(cli.filter(c => c.status === 'ativo'))
        setContratos(cont)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Falha ao carregar dados operacionais.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSave() {
    if (!form.clienteId || !form.descricao.trim()) {
      setError('Selecione um cliente e descreva o que aconteceu.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Busca o contrato ativo para este cliente
      const contrato = contratos.find(c => c.clienteId === form.clienteId)
      if (!contrato) {
        throw new Error('Nenhum contrato ativo encontrado para este cliente.')
      }

      const input: NovaVisitaInput = {
        clienteId: form.clienteId,
        contratoId: contrato.id,
        status: 'realizada',
        tipo_visita: form.tipoVisita,
        modalidade: 'presencial',
        duracao_minutos: 60,
        data_hora: new Date().toISOString(),
        descricao: form.descricao.trim(),
        resultados: 'Registro rápido de campo.',
        pendencias: []
      }

      // Se houver pendência rápida escrita, adiciona
      if (form.pendenciaRapida.trim()) {
        input.pendencias?.push({
          descricao: form.pendenciaRapida.trim(),
          data_prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 dias default
          responsavel: 'Equipe Técnica'
        })
      }

      await VisitasService.criar(input)
      clearDraft()
      setSaving(false)
      setSaved(true)
    } catch (err: unknown) {
      console.error('Erro ao salvar registro rápido:', err)
      const message = err instanceof Error ? err.message : 'Falha ao salvar. Tente novamente.'
      setError(message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <div className="size-8 border-4 border-[#0466C8]/20 border-t-[#0466C8] rounded-full animate-spin" />
      </div>
    )
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center px-6 text-center">
        <div className="size-16 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center mb-5">
          <span className="text-emerald-400 text-3xl">⚡</span>
        </div>
        <p className="text-white text-xl font-bold mb-1">Relato rápido salvo</p>
        <p className="text-[#7D8597] text-sm">O histórico foi atualizado com sucesso.</p>

        <div className="mt-10 w-full max-w-sm space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#0466C8] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
          >
            Voltar ao Início
          </button>
          
          <button
            onClick={() => router.push(`/clientes/${form.clienteId}`)}
            className="w-full bg-[#0d1117] border border-[#23272F] text-[#7D8597] font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
          >
            Ver Timeline do Cliente
          </button>

          <button
            onClick={() => {
              setSaved(false)
              setForm({
                clienteId: '',
                tipoVisita: 'rotineira',
                descricao: '',
                pendenciaRapida: ''
              })
            }}
            className="w-full text-[#4A5568] text-xs font-bold uppercase tracking-widest py-4"
          >
            Registrar outro relato
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#07090D] text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-4">
        <button onClick={() => router.back()} className="text-[#7D8597] active:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-white text-base font-bold">Relato Rápido</h1>
      </div>

      {/* ── AVISO DE DRAFT RECUPERADO ── */}
      {showDraftNotice && (
        <div className="bg-[#0466C8]/20 border border-[#0466C8]/40 rounded-xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md mb-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-[#0466C8] flex items-center justify-center shrink-0">
              <RotateCcw size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Rascunho recuperado</p>
              <p className="text-blue-200/70 text-[10px]">Você tem um relato não finalizado.</p>
            </div>
          </div>
          <button 
            onClick={descartarDraft}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-wider font-black text-blue-300 transition-colors flex items-center gap-2"
          >
            <X size={12} /> Descartar
          </button>
        </div>
      )}

      {/* Toggle removido conforme nova orientação de fluxo separado */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Cliente */}
        <section>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7D8597] mb-3">
            Cliente
          </label>
          <select
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
            className="w-full bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#0466C8] appearance-none"
          >
            <option value="">Selecione o cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome_instituicao}</option>
            ))}
          </select>
        </section>

        {/* Tipo de Visita */}
        <section>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7D8597] mb-3">
            Tipo
          </label>
          <div className="flex gap-2">
            {(['rotineira', 'urgente', 'acompanhamento direcionado'] as TipoVisita[]).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setForm({ ...form, tipoVisita: tipo })}
                className={`flex-1 py-4 px-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-[0.98] ${
                  form.tipoVisita === tipo 
                    ? 'bg-[#0466C8] border-[#0466C8] text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-[#0d1117] border-[#23272F] text-[#7D8597]'
                }`}
              >
                {tipo.split(' ')[0]}
              </button>
            ))}
          </div>
        </section>

        {/* Relato */}
        <section>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7D8597] mb-3">
            O que aconteceu?
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Resumo rápido do campo..."
            className="w-full h-40 bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#0466C8] resize-none"
          />
        </section>

        {/* Pendência Rápida */}
        <section>
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#7D8597] mb-3">
            Gerar Pendência? (Opcional)
          </label>
          <input
            type="text"
            value={form.pendenciaRapida}
            onChange={(e) => setForm({ ...form, pendenciaRapida: e.target.value })}
            placeholder="Ex: Enviar relatório, Agendar retorno..."
            className="w-full bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#0466C8]"
          />
        </section>
      </div>

      {/* Save Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-[#07090D] via-[#07090D] to-transparent z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#0466C8] hover:bg-[#0353A4] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-2xl shadow-blue-900/40 transition-all active:scale-[0.98]"
        >
          {saving ? 'Salvando...' : 'Finalizar Registro'}
        </button>
      </div>
    </main>
  )
}
