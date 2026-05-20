'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { VisitasService, type NovaVisitaInput } from '@/services/visitas.service'
import { EventosService } from '@/services/eventos.service'
import { ContatosService } from '@/services/contatos.service'
import { VisitasExtraService } from '@/services/visitas-extra.service'
import { useLocalDraft } from '@/hooks/useLocalDraft'
import { RotateCcw, X } from 'lucide-react'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { Contato } from '@/domain/contato'
import type { TipoVisita } from '@/domain/visita'

function RegistroRapidoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingStep, setSavingStep] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [contatosCliente, setContatosCliente] = useState<Contato[]>([])
  const [showDraftNotice, setShowDraftNotice] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('draft_visita_rapida')
    if (!saved) return false
    try {
      const draft = JSON.parse(saved)
      return !!(draft.clienteId || draft.descricao || draft.pendenciaRapida || draft.temCrise || draft.isExtra)
    } catch {
      return false
    }
  })

  // Form State via Local Draft
  const [form, setForm, clearDraft] = useLocalDraft('visita_rapida', {
    clienteId: '',
    tipoVisita: 'rotineira' as TipoVisita,
    descricao: '',
    pendenciaRapida: '',
    temCrise: false,
    criseDescricao: '',
    criseAcaoTomada: '',
    isExtra: false,
    solicitadoPor: ''
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

        // Se houver clienteId restaurado do rascunho (draft) no localStorage, carrega seus contatos
        const savedDraft = typeof window !== 'undefined' ? localStorage.getItem('draft_visita_rapida') : null
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft)
            if (draft.clienteId) {
              const contatos = await ContatosService.getByClienteId(draft.clienteId)
              setContatosCliente(contatos)
            }
          } catch {
            // Ignora erro de parsing de rascunho corrompido
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        setError('Falha ao carregar dados operacionais.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-seleciona o cliente se contratoId for fornecido via URL
  useEffect(() => {
    const contratoId = searchParams.get('contratoId')
    if (contratoId && contratos.length > 0) {
      const contrato = contratos.find(c => String(c.id) === String(contratoId))
      if (contrato) {
        Promise.resolve().then(() => {
          setForm(f => ({
            ...f,
            clienteId: contrato.clienteId
          }))
        })
      }
    }
  }, [searchParams, contratos, setForm])

  // Carrega contatos automaticamente quando form.clienteId mudar (essencial para pré-seleção)
  useEffect(() => {
    if (!form.clienteId) {
      Promise.resolve().then(() => {
        setContatosCliente([])
      })
      return
    }
    let active = true
    ContatosService.getByClienteId(form.clienteId)
      .then(data => {
        if (active) {
          setContatosCliente(data)
        }
      })
      .catch(err => console.error('Erro ao buscar contatos:', err))
    return () => {
      active = false
    }
  }, [form.clienteId])

  async function handleSave() {
    if (!form.clienteId || !form.descricao.trim()) {
      setError('Selecione um cliente e descreva o que aconteceu.')
      return
    }
    if (form.isExtra && !form.solicitadoPor) {
      setError('Selecione quem solicitou a visita extra.')
      return
    }
    if (form.temCrise && !form.criseDescricao?.trim()) {
      setError('A descrição da situação crítica é obrigatória.')
      return
    }

    setSaving(true)
    setError(null)
    setSavingStep('Registrando relato rápido...')

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

      // Criar a visita
      const created = await VisitasService.criar(input)

      // Se for visita extra, salvar fisicamente na tabela visitas_extra
      if (form.isExtra && created?.id_visita) {
        setSavingStep('Registrando visita extra...')
        await VisitasExtraService.create({
          id_visita: Number(created.id_visita),
          solicitado_por: Number(form.solicitadoPor)
        })
      }

      // Se houver crise selecionada, salvar de forma encadeada síncrona
      if (form.temCrise && created?.id_visita) {
        setSavingStep('Integrando situação crítica...')
        await EventosService.create({
          id_contrato: Number(contrato.id),
          id_visita: Number(created.id_visita),
          data_evento: new Date().toISOString().split('T')[0],
          descricao: form.criseDescricao.trim(),
          acao_tomada: form.criseAcaoTomada?.trim() || 'Intervenção técnica imediata realizada pelo Adriano.'
        })
      }

      clearDraft()
      setSaving(false)
      setSaved(true)
    } catch (err: unknown) {
      console.error('Erro ao salvar registro rápido:', err)
      const message = err instanceof Error ? err.message : 'Falha ao salvar. Tente novamente.'
      setError(message)
      setSaving(false)
      setSavingStep('')
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
        <p className="text-white text-xl font-bold mb-1">
          {form.temCrise ? 'Relato e situação crítica salvos!' : 'Relato rápido salvo'}
        </p>
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
                pendenciaRapida: '',
                temCrise: false,
                criseDescricao: '',
                criseAcaoTomada: '',
                isExtra: false,
                solicitadoPor: ''
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
            onChange={async (e) => {
              const val = e.target.value
              setForm({ ...form, clienteId: val, solicitadoPor: '' })
              setError(null)
              if (!val) {
                setContatosCliente([])
                return
              }
              try {
                const data = await ContatosService.getByClienteId(val)
                setContatosCliente(data)
              } catch (err) {
                console.error('Erro ao buscar contatos:', err)
              }
            }}
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
            value={form.pendenciaRapida || ''}
            onChange={(e) => setForm({ ...form, pendenciaRapida: e.target.value })}
            placeholder="Ex: Enviar relatório, Agendar retorno..."
            className="w-full bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#0466C8]"
          />
        </section>

        {/* SELEÇÃO DE VISITA EXTRA E SOLICITANTE */}
        <section className="bg-zinc-950/40 border border-[#23272F]/60 rounded-2xl p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!form.isExtra}
              onChange={e => {
                setForm({ ...form, isExtra: e.target.checked, solicitadoPor: '' })
                setError(null)
              }}
              className="size-4 rounded border-zinc-800 bg-[#0d1117] text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-white">Marcar como Visita Extra</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#7D8597]">Não Planejada / Demanda Sobressalente</p>
            </div>
          </label>

          {form.isExtra && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-2 pt-4 border-t border-zinc-900/50">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#7D8597] ml-1">Quem solicitou a visita? *</label>
              <select
                value={form.solicitadoPor || ''}
                onChange={e => {
                  setForm({ ...form, solicitadoPor: e.target.value })
                  setError(null)
                }}
                className="w-full bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-sky-500 text-white"
              >
                <option value="">Selecione o solicitante...</option>
                {contatosCliente.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cargo ? `(${c.cargo})` : ''} {c.papel ? `· ${c.papel}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* SELEÇÃO DE SITUAÇÃO CRÍTICA (CAUSALIDADE OPERACIONAL) */}
        <section className="bg-zinc-950/40 border border-[#23272F]/60 rounded-2xl p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!form.temCrise}
              onChange={e => {
                setForm({ ...form, temCrise: e.target.checked })
                setError(null)
              }}
              className="size-4 rounded border-zinc-800 bg-[#0d1117] text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div>
              <p className="text-xs font-bold text-white">Houve situação crítica nesta visita</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/80">Registra uma intercorrência importante na linha do tempo operacional</p>
            </div>
          </label>

          {form.temCrise && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-4 pt-4 border-t border-zinc-900/50">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#7D8597] ml-1">Descrição da Situação Crítica *</label>
                <textarea
                  value={form.criseDescricao || ''}
                  onChange={e => {
                    setForm({ ...form, criseDescricao: e.target.value })
                    setError(null)
                  }}
                  rows={2}
                  placeholder="Descreva a intercorrência crítica encontrada em campo..."
                  className="w-full bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-rose-500 text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#7D8597] ml-1">Ação Tomada (Opcional)</label>
                <input
                  type="text"
                  value={form.criseAcaoTomada || ''}
                  onChange={e => setForm({ ...form, criseAcaoTomada: e.target.value })}
                  placeholder="Opcional. Padrão: Intervenção técnica imediata realizada pelo Adriano."
                  className="w-full bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-rose-500 text-white"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Save Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-[#07090D] via-[#07090D] to-transparent z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full hover:bg-[#0353A4] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-2xl transition-all active:scale-[0.98] ${
            saving 
              ? 'bg-[#0466C8]/40 text-blue-300 animate-pulse' 
              : 'bg-[#0466C8] shadow-blue-900/40'
          }`}
        >
          {saving ? (savingStep || 'Salvando...') : 'Finalizar Registro'}
        </button>
      </div>
    </main>
  )
}

export default function RegistroRapidoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090D] flex items-center justify-center"><div className="size-8 border-4 border-[#0466C8]/20 border-t-[#0466C8] rounded-full animate-spin" /></div>}>
      <RegistroRapidoForm />
    </Suspense>
  )
}
