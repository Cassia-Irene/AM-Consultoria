'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VisitasService } from '@/services/visitas.service'
import { EventosService, EventoCritico } from '@/services/eventos.service'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import type { TipoVisita, ModalidadeVisita } from '@/domain/visita'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VisitaEdicaoPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [tipoVisita, setTipoVisita] = useState<TipoVisita>('rotineira')
  const [modalidade, setModalidade] = useState<ModalidadeVisita>('presencial')
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(60)
  const [descricao, setDescricao] = useState('')
  const [resultados, setResultados] = useState('')

  // Crisis States
  const [temCrise, setTemCrise] = useState(false)
  const [criseDescricao, setCriseDescricao] = useState('')
  const [criseAcaoTomada, setCriseAcaoTomada] = useState('')
  const [eventoExistente, setEventoExistente] = useState<EventoCritico | null>(null)
  const [contratoId, setContratoId] = useState<number | null>(null)
  const [dataVisita, setDataVisita] = useState<string>('')

  useEffect(() => {
    async function loadVisita() {
      try {
        setLoading(true)
        const v = await VisitasService.getById(id)
        if (v) {
          setTipoVisita(v.tipo_visita)
          setModalidade(v.modalidade)
          setDuracaoMinutos(v.duracao_minutos || 60)
          setDescricao(v.descricao)
          setResultados(v.resultados || '')
          setContratoId(Number(v.contratoId))
          setDataVisita(v.data_hora)

          // Buscar se há crise / evento crítico vinculado a esta visita
          const ev = await EventosService.getByVisitaId(id)
          if (ev) {
            setEventoExistente(ev)
            setTemCrise(true)
            setCriseDescricao(ev.descricao)
            setCriseAcaoTomada(ev.acao_tomada || '')
          }
        }
      } catch (err) {
        console.error('[VISITA_EDIT_LOAD]', err)
        setError('Não foi possível carregar os detalhes do log para edição.')
      } finally {
        setLoading(false)
      }
    }
    loadVisita()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) {
      setError('A descrição do relato é obrigatória.')
      return
    }
    if (temCrise && !criseDescricao.trim()) {
      setError('A descrição da situação crítica é obrigatória.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // 1. Atualizar a visita
      await VisitasService.update(id, {
        tipo_visita: tipoVisita,
        modalidade: modalidade,
        duracao_minutos: Number(duracaoMinutos),
        descricao: descricao.trim(),
        resultados: resultados.trim() || null
      })

      // 2. Tratar o Evento Crítico
      if (temCrise) {
        const evPayload = {
          id_contrato: contratoId || 1,
          id_visita: Number(id),
          data_evento: dataVisita ? dataVisita.split('T')[0] : new Date().toISOString().split('T')[0],
          descricao: criseDescricao.trim(),
          acao_tomada: criseAcaoTomada.trim() || 'Intervenção técnica imediata realizada pelo Adriano.'
        }

        if (eventoExistente && eventoExistente.id_evento) {
          // Atualizar
          await EventosService.update(eventoExistente.id_evento, evPayload)
        } else {
          // Criar novo retrospectivamente
          await EventosService.create(evPayload)
        }
      } else if (eventoExistente && eventoExistente.id_evento) {
        // Adriano desmarcou a situação crítica: desvincula a crise da visita no banco de dados!
        await EventosService.update(eventoExistente.id_evento, {
          id_visita: undefined
        })
      }

      router.push(`/visitas/${id}`)
      router.refresh()
    } catch (err) {
      console.error('[VISITA_EDIT_SAVE]', err)
      setError('Falha ao salvar as alterações no log de visita ou situação crítica.')
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton />

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 border-b border-zinc-800/50 bg-zinc-900/20 sticky top-0 z-10 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-sky-500 transition-colors mb-4 flex items-center gap-1.5"
        >
          <ArrowLeft size={10} strokeWidth={3} />
          Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-black tracking-tight uppercase italic">Editar Log</h1>
            <p className="text-zinc-300 text-xs md:text-sm font-bold mt-2 md:mt-3">Retificação tática de visita #{id}</p>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <form onSubmit={handleSave} className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Tipo & Modalidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-zinc-200 ml-1">Tipo de Visita</label>
            <select
              value={tipoVisita}
              onChange={(e) => setTipoVisita(e.target.value as TipoVisita)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-sky-500 text-white appearance-none"
            >
              <option value="rotineira">Rotineira</option>
              <option value="urgente">Urgente</option>
              <option value="pontual">Pontual</option>
              <option value="estruturada">Estruturada</option>
              <option value="acompanhamento direcionado">Acompanhamento Direcionado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-zinc-200 ml-1">Modalidade</label>
            <select
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value as ModalidadeVisita)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-sky-500 text-white appearance-none"
            >
              <option value="presencial">Presencial</option>
              <option value="remota">Remota</option>
            </select>
          </div>
        </div>

        {/* Duração */}
        <div className="space-y-2">
          <label className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-zinc-200 ml-1">Duração (Minutos)</label>
          <input
            type="number"
            min="1"
            value={duracaoMinutos}
            onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-900 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-sky-500 text-white"
          />
        </div>

        {/* Descrição / Relato */}
        <div className="space-y-2">
          <label className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-zinc-200 ml-1">O que aconteceu?</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Relato de imersão de campo..."
            className="w-full h-40 bg-zinc-900 border border-zinc-900 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-sky-500 text-white resize-none"
          />
        </div>

        {/* Resultados */}
        <div className="space-y-2">
          <label className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-zinc-200 ml-1">Resultados e Conclusões (Opcional)</label>
          <textarea
            value={resultados}
            onChange={(e) => setResultados(e.target.value)}
            placeholder="Impacto, goodwill gerado, ou acordos firmados..."
            className="w-full h-32 bg-zinc-900 border border-zinc-900 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-sky-500 text-white resize-none"
          />
        </div>

        {/* SELEÇÃO DE SITUAÇÃO CRÍTICA (CAUSALIDADE OPERACIONAL) */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!temCrise}
              onChange={e => {
                setTemCrise(e.target.checked)
                setError(null)
              }}
              className="size-4 rounded border-zinc-800 bg-zinc-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div>
              <p className="text-xs md:text-[12px] font-bold text-white mb-2">Houve situação crítica nesta visita</p>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-rose-500/80">Registra uma intercorrência importante na linha do tempo operacional</p>
            </div>
          </label>

          {temCrise && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-4 pt-4 border-t border-zinc-900/50">
              <div className="space-y-2">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-200 ml-1">Descrição da Situação Crítica *</label>
                <textarea
                  value={criseDescricao || ''}
                  onChange={e => {
                    setCriseDescricao(e.target.value)
                    setError(null)
                  }}
                  rows={2}
                  placeholder="Descreva a intercorrência crítica encontrada em campo..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-rose-500 text-white resize-none placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-200 ml-1">Ação Tomada (Opcional)</label>
                <input
                  type="text"
                  value={criseAcaoTomada || ''}
                  onChange={e => setCriseAcaoTomada(e.target.value)}
                  placeholder="Opcional. Padrão: Intervenção técnica imediata realizada pelo Adriano."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 mt-2 md:mt-3 text-sm focus:outline-none focus:border-rose-500 text-white placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fixed Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-[#07090D] via-[#07090D]/90 to-transparent pointer-events-none z-20">
          <div className="max-w-2xl mx-auto flex gap-3 pointer-events-auto">
            <button
              type="submit"
              disabled={saving || !descricao.trim()}
              className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-sky-950/20"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Gravar Alterações
                </>
              )}
            </button>
            <Link 
              href={`/visitas/${id}`}
              className="px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl text-center transition-all active:scale-[0.98] flex items-center justify-center"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#07090D] p-10 space-y-8 animate-pulse">
      <div className="h-6 w-32 bg-zinc-900 rounded" />
      <div className="h-10 w-64 bg-zinc-900 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-14 bg-zinc-900 rounded-2xl" />
        <div className="h-14 bg-zinc-900 rounded-2xl" />
      </div>
      <div className="h-14 bg-zinc-900 rounded-2xl" />
      <div className="h-44 bg-zinc-900 rounded-2xl" />
    </div>
  )
}
