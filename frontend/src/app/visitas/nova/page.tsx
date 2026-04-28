'use client'
// app/visitas/nova/page.tsx
//
// Nova Visita = Gerador de ações futuras.
// Estrutura em 3 etapas:
//   1. O que aconteceu  (contexto mínimo obrigatório)
//   2. O que ficou aberto  (gerador de pendências)
//   3. Confirmação

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Clientes } from '../../../mocks/clientes'

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

type TipoVisita = 'Regular' | 'Extra'

type PrioridadePendencia = 'urgente' | 'atencao' | 'normal'

interface PendenciaGerada {
  id: string
  titulo: string
  prazo: string          // dd/mm/yyyy
  prioridade: PrioridadePendencia
}

/** Sugestão gerada automaticamente pelo sistema a partir do resumo */
interface PendenciaSugerida extends PendenciaGerada {
  gatilho: string        // keyword que disparou a sugestão
  estado: 'pendente' | 'editando'  // descartada = removida do array
}

interface FormState {
  clienteId: string
  tipoVisita: TipoVisita
  resumo: string         // o que aconteceu — curto, obrigatório
  observacoes: string    // anotação livre — opcional
  pendencias: PendenciaGerada[]
}

type Etapa = 1 | 2 | 3

/* ─────────────────────────────────────────────
   MOTOR DE SUGESTÕES — heurísticas locais
───────────────────────────────────────────── */

interface Regra {
  palavras: string[]
  titulo: string
  prioridade: PrioridadePendencia
  diasAFrente: number
  gatilho: string  // label amigável para exibir
}

const REGRAS: Regra[] = [
  {
    palavras: ['anvisa', 'vigilância', 'vigilancia', 'sanitária', 'sanitaria', 'inspeção', 'inspecao', 'fiscal'],
    titulo: 'Pendência ANVISA',
    prioridade: 'urgente',
    diasAFrente: 3,
    gatilho: 'ANVISA',
  },
  {
    palavras: ['relatório', 'relatorio', 'laudo', 'documento', 'documentação', 'documentacao'],
    titulo: 'Enviar relatório',
    prioridade: 'atencao',
    diasAFrente: 7,
    gatilho: 'relatório',
  },
  {
    palavras: ['contrato', 'renovação', 'renovacao', 'assinatura', 'assinar', 'assinou'],
    titulo: 'Resolver pendência contratual',
    prioridade: 'atencao',
    diasAFrente: 5,
    gatilho: 'contrato',
  },
  {
    palavras: ['fatura', 'pagamento', 'boleto', 'cobrança', 'cobranca', 'cobrar', 'pagar'],
    titulo: 'Regularizar pagamento',
    prioridade: 'urgente',
    diasAFrente: 2,
    gatilho: 'pagamento',
  },
  {
    palavras: ['treinamento', 'capacitação', 'capacitacao', 'capacitar', 'treinar'],
    titulo: 'Agendar treinamento com equipe',
    prioridade: 'normal',
    diasAFrente: 14,
    gatilho: 'treinamento',
  },
  {
    palavras: ['retorno', 'voltar', 'reagendar', 'próxima visita', 'proxima visita'],
    titulo: 'Agendar próxima visita',
    prioridade: 'normal',
    diasAFrente: 7,
    gatilho: 'retorno',
  },
  {
    palavras: ['alvará', 'alvara', 'licença', 'licenca', 'renovação alvará'],
    titulo: 'Renovar alvará/licença',
    prioridade: 'atencao',
    diasAFrente: 10,
    gatilho: 'alvará',
  },
  {
    palavras: ['equipe', 'funcionários', 'funcionarios', 'colaborador'],
    titulo: 'Acompanhar equipe',
    prioridade: 'normal',
    diasAFrente: 7,
    gatilho: 'equipe',
  },
]

/** Palavras que elevam qualquer sugestão para 'urgente' */
const BOOSTS_URGENTE = ['urgente', 'urgência', 'urgencia', 'crítico', 'critico', 'imediato', 'prazo']

function prazoEmDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toLocaleDateString('pt-BR')  // dd/mm/yyyy
}

function sugerirPendencias(resumo: string): PendenciaSugerida[] {
  const texto = resumo.toLowerCase()
  const ehUrgente = BOOSTS_URGENTE.some(p => texto.includes(p))
  const sugestoes: PendenciaSugerida[] = []

  for (const regra of REGRAS) {
    const match = regra.palavras.some(p => texto.includes(p))
    if (!match) continue

    const prioridade: PrioridadePendencia =
      ehUrgente && regra.prioridade !== 'urgente' ? 'atencao' : regra.prioridade

    sugestoes.push({
      id: uid(),
      titulo: regra.titulo,
      prazo: prazoEmDias(regra.diasAFrente),
      prioridade,
      gatilho: regra.gatilho,
      estado: 'pendente',
    })
  }

  return sugestoes
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

const clientesAtivos = Clientes.filter(c => c.status === 'ativo')

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function pendenciaVazia(): PendenciaGerada {
  return { id: uid(), titulo: '', prazo: '', prioridade: 'normal' }
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────── */

/** Indicador de etapas no topo */
function EtapaIndicador({ atual }: { atual: Etapa }) {
  const etapas = [
    { num: 1, label: 'O que aconteceu' },
    { num: 2, label: 'Ficou algo aberto?' },
    { num: 3, label: 'Confirmar' },
  ]

  return (
    <div className="flex items-center gap-0 px-5 py-3 border-b border-[#23272F]">
      {etapas.map((e, i) => (
        <div key={e.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
              e.num < atual
                ? 'bg-emerald-500 text-white'
                : e.num === atual
                  ? 'bg-[#0466C8] text-white'
                  : 'bg-[#23272F] text-white'
            }`}>
              {e.num < atual ? '✓' : e.num}
            </div>
            <p className={`text-[9px] mt-0.5 font-medium whitespace-nowrap ${
              e.num === atual ? 'text-[#0466C8]' : 'text-white'
            }`}>
              {e.label}
            </p>
          </div>
          {i < etapas.length - 1 && (
            <div className={`flex-1 h-px mx-1 mb-3 transition-colors ${
              e.num < atual ? 'bg-emerald-500' : 'bg-[#23272F]'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

/** Card de pendência gerada na etapa 2 */
function PendenciaCard({
  p,
  onChange,
  onRemove,
}: {
  p: PendenciaGerada
  onChange: (updated: PendenciaGerada) => void
  onRemove: () => void
}) {
  const prioMap: { value: PrioridadePendencia; label: string; color: string }[] = [
    { value: 'urgente', label: 'Urgente',  color: 'bg-red-900/50 text-red-400 border-red-800' },
    { value: 'atencao', label: 'Atenção',  color: 'bg-amber-900/50 text-amber-400 border-amber-800' },
    { value: 'normal',  label: 'Normal',   color: 'bg-[#23272F] text-[#7D8597] border-[#23272F]' },
  ]

  return (
    <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-4 space-y-3">
      {/* Título */}
      <input
        type="text"
        value={p.titulo}
        onChange={e => onChange({ ...p, titulo: e.target.value })}
        placeholder="O que ficou pendente?"
        className="w-full bg-transparent text-white text-sm font-medium placeholder-[#7D8597] border-b border-[#23272F] pb-2 focus:outline-none focus:border-[#0466C8] transition-colors"
      />

      {/* Prioridade + Prazo na mesma linha */}
      <div className="flex gap-2">
        {/* Prioridade */}
        <div className="flex gap-1">
          {prioMap.map(pr => (
            <button
              type="button"
              key={pr.value}
              onClick={() => onChange({ ...p, prioridade: pr.value })}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                p.prioridade === pr.value ? pr.color : 'bg-transparent text-[#7D8597] border-[#23272F]'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>

        {/* Prazo */}
        <input
          type="text"
          value={p.prazo}
          onChange={e => onChange({ ...p, prazo: e.target.value })}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          className="flex-1 bg-[#23272F] text-white text-xs rounded-lg px-3 py-1 placeholder-[#7D8597] focus:outline-none focus:ring-1 focus:ring-[#0466C8] min-w-0"
        />
      </div>

      {/* Remover */}
      <button
        type="button"
        onClick={onRemove}
        className="text-[10px] text-[#7D8597] active:text-red-400 transition-colors"
      >
        Remover
      </button>
    </div>
  )
}

/** Card de sugestão automática — aceitar (1 toque), editar inline ou descartar */
function SugestaoCard({
  s,
  onAceitar,
  onEditar,
  onDescartar,
  onChange,
}: {
  s: PendenciaSugerida
  onAceitar: () => void
  onEditar: () => void
  onDescartar: () => void
  onChange: (updated: PendenciaSugerida) => void
}) {
  const prioMap = [
    { value: 'urgente' as PrioridadePendencia, label: 'Urgente',  ring: 'border-red-500',   dot: 'bg-red-500',   text: 'text-red-400' },
    { value: 'atencao' as PrioridadePendencia, label: 'Atenção', ring: 'border-amber-400', dot: 'bg-amber-400', text: 'text-amber-400' },
    { value: 'normal'  as PrioridadePendencia, label: 'Normal',  ring: 'border-[#23272F]', dot: 'bg-[#7D8597]', text: 'text-[#7D8597]' },
  ]
  const prio = prioMap.find(p => p.value === s.prioridade)!

  if (s.estado === 'editando') {
    return (
      <div className="bg-[#0d1117] border border-[#0466C8] rounded-2xl px-4 py-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0466C8]">Editando</p>
        <input
          type="text"
          value={s.titulo}
          onChange={e => onChange({ ...s, titulo: e.target.value })}
          className="w-full bg-transparent text-white text-sm font-medium border-b border-[#23272F] pb-2 focus:outline-none focus:border-[#0466C8] transition-colors"
          autoFocus
        />
        <div className="flex gap-2">
          <div className="flex gap-1">
            {prioMap.map(pr => (
              <button type="button" key={pr.value}
                onClick={() => onChange({ ...s, prioridade: pr.value })}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  s.prioridade === pr.value ? `bg-[#23272F] ${pr.text} ${pr.ring}` : 'bg-transparent text-[#7D8597] border-[#23272F]'
                }`}>
                {pr.label}
              </button>
            ))}
          </div>
          <input type="text" value={s.prazo}
            onChange={e => onChange({ ...s, prazo: e.target.value })}
            placeholder="dd/mm/aaaa" maxLength={10}
            className="flex-1 bg-[#23272F] text-white text-xs rounded-lg px-3 py-1 placeholder-[#7D8597] focus:outline-none focus:ring-1 focus:ring-[#0466C8] min-w-0"
          />
        </div>
        <button type="button" onClick={onAceitar}
          className="w-full bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl py-2.5 transition-colors">
          ✓ Confirmar
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-[#0d1117] border ${prio.ring} rounded-2xl px-4 py-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-[#7D8597] uppercase tracking-wide">
          🔍 detectado: &ldquo;{s.gatilho}&rdquo;
        </span>
        <button type="button" onClick={onDescartar}
          className="text-[#7D8597] active:text-red-400 text-xs leading-none px-1">
          ✕
        </button>
      </div>
      <p className="text-white font-semibold text-sm mb-0.5">{s.titulo}</p>
      <p className={`text-xs ${prio.text} mb-3`}>
        <span className={`inline-block size-1.5 rounded-full ${prio.dot} mr-1`} />
        {s.prioridade === 'urgente' ? 'Urgente' : s.prioridade === 'atencao' ? 'Atenção' : 'Normal'}
        {' · '}
        {s.prazo}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onAceitar}
          className="flex-1 bg-emerald-700/30 active:bg-emerald-700/60 text-emerald-400 text-sm font-bold rounded-xl py-2.5 border border-emerald-700/40 transition-colors">
          ✓ Aceitar
        </button>
        <button type="button" onClick={onEditar}
          className="flex-1 bg-[#23272F] active:bg-[#0d1117] text-[#7D8597] text-sm font-semibold rounded-xl py-2.5 transition-colors">
          Editar
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function NovaVisitaPage() {
  const router = useRouter()

  const [etapa, setEtapa] = useState<Etapa>(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sugestoes, setSugestoes] = useState<PendenciaSugerida[]>([])

  const [form, setForm] = useState<FormState>({
    clienteId: '',
    tipoVisita: 'Regular',
    resumo: '',
    observacoes: '',
    pendencias: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  /* ── navegação entre etapas ── */
  function avancarEtapa1() {
    const e: typeof errors = {}
    if (!form.clienteId) e.clienteId = 'Selecione o cliente'
    if (!form.resumo.trim()) e.resumo = 'Descreva brevemente o que aconteceu'
    setErrors(e)
    if (Object.keys(e).length === 0) {
      // Gera sugestões a partir do resumo (só se ainda não gerou)
      if (sugestoes.length === 0) {
        setSugestoes(sugerirPendencias(form.resumo))
      }
      setEtapa(2)
    }
  }

  function avancarEtapa2() {
    setEtapa(3)
  }

  /* ── sugestões ── */
  function aceitarSugestao(id: string) {
    const s = sugestoes.find(s => s.id === id)
    if (!s) return
    // move para pendencias confirmadas
    setForm(f => ({ ...f, pendencias: [...f.pendencias, { id: s.id, titulo: s.titulo, prazo: s.prazo, prioridade: s.prioridade }] }))
    setSugestoes(ss => ss.filter(s => s.id !== id))
  }

  function editarSugestao(id: string) {
    setSugestoes(ss => ss.map(s => s.id === id ? { ...s, estado: 'editando' } : s))
  }

  function descartarSugestao(id: string) {
    setSugestoes(ss => ss.filter(s => s.id !== id))
  }

  function updateSugestao(id: string, updated: PendenciaSugerida) {
    setSugestoes(ss => ss.map(s => s.id === id ? updated : s))
  }
  function addPendencia() {
    setForm(f => ({ ...f, pendencias: [...f.pendencias, pendenciaVazia()] }))
  }

  function updatePendencia(id: string, updated: PendenciaGerada) {
    setForm(f => ({
      ...f,
      pendencias: f.pendencias.map(p => p.id === id ? updated : p),
    }))
  }

  function removePendencia(id: string) {
    setForm(f => ({ ...f, pendencias: f.pendencias.filter(p => p.id !== id) }))
  }

  /* ── submit ── */
  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    setSaving(true)
    // TODO: await api.visitas.create({ ...form })
    // Pendências com prioridade=urgente → viram cards no Modo Caos
    // Pendências normais → viram histórico + Modo Planejamento
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setTimeout(() => router.push('/dashboard'), 1400)
  }

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const nomeCliente = clientesAtivos.find(c => c.id === form.clienteId)?.nome ?? ''

  /* ────────── TELA DE CONFIRMAÇÃO ────────── */
  if (saved) {
    const urgentes = form.pendencias.filter(p => p.prioridade === 'urgente').length
    const total    = form.pendencias.length

    return (
      <main className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center px-6 text-center">
        <div className="size-16 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center mb-5">
          <span className="text-emerald-400 text-3xl">✓</span>
        </div>
        <p className="text-white text-xl font-bold mb-1">Visita registrada</p>
        <p className="text-[#7D8597] text-sm">{nomeCliente}</p>

        {total > 0 && (
          <div className="mt-5 bg-[#0d1117] border border-[#23272F] rounded-2xl px-5 py-4 text-left w-full max-w-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Gerado agora
            </p>
            <div className="space-y-1">
              {urgentes > 0 && (
                <p className="text-red-400 text-sm font-semibold">
                  {urgentes} pendência{urgentes > 1 ? 's' : ''} urgente{urgentes > 1 ? 's' : ''} → Modo Caos
                </p>
              )}
              {total - urgentes > 0 && (
                <p className="text-[#979DAC] text-sm">
                  {total - urgentes} pendência{total - urgentes > 1 ? 's' : ''} → Planejamento
                </p>
              )}
            </div>
          </div>
        )}

        <p className="text-[#7D8597] text-xs mt-5">Voltando ao painel...</p>
      </main>
    )
  }

  /* ────────── LAYOUT BASE ────────── */
  return (
    <main className="min-h-screen bg-[#07090D]">

      {/* HEADER */}
      <div className="bg-[#07090D] border-b border-[#23272F] px-4 pt-10 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => etapa === 1 ? router.back() : setEtapa(e => (e - 1) as Etapa)}
            className="size-9 flex items-center justify-center rounded-xl text-[#7D8597] active:text-white active:bg-[#23272F] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-white text-base font-bold">Nova visita</h1>
            <p className="text-[#7D8597] text-xs capitalize">{hoje}</p>
          </div>
        </div>
        <EtapaIndicador atual={etapa} />
      </div>

      {/* ════════════════════════════
          ETAPA 1 — O QUE ACONTECEU
      ════════════════════════════ */}
      {etapa === 1 && (
        <div className="px-4 pt-5 pb-32 space-y-5">

          {/* Cliente */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Cliente *
            </label>
            <select
              value={form.clienteId}
              onChange={e => {
                setForm(f => ({ ...f, clienteId: e.target.value }))
                setErrors(er => ({ ...er, clienteId: undefined }))
              }}
              className={`w-full rounded-xl border px-4 py-3.5 text-base text-white bg-[#0d1117] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 ${
                errors.clienteId ? 'border-red-500' : 'border-[#23272F]'
              }`}
            >
              <option value="" className="bg-[#0d1117]">Selecione o cliente...</option>
              {clientesAtivos.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0d1117]">{c.nome}</option>
              ))}
            </select>
            {errors.clienteId && <p className="mt-1 text-xs text-red-400">{errors.clienteId}</p>}
          </div>

          {/* Tipo de visita */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Tipo
            </label>
            <div className="flex gap-2">
              {(['Regular', 'Extra'] as TipoVisita[]).map(tipo => (
                <button
                  type="button"
                  key={tipo}
                  onClick={() => setForm(f => ({ ...f, tipoVisita: tipo }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    form.tipoVisita === tipo
                      ? 'bg-[#001845] text-white border-[#0466C8]'
                      : 'bg-[#0d1117] text-[#7D8597] border-[#23272F]'
                  }`}
                >
                  {tipo}
                  {tipo === 'Extra' && (
                    <span className="block text-[9px] font-normal opacity-60">Fora do contrato</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo — curto e objetivo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              O que aconteceu? *
            </label>
            <textarea
              value={form.resumo}
              onChange={e => {
                setForm(f => ({ ...f, resumo: e.target.value }))
                if (e.target.value.trim()) setErrors(er => ({ ...er, resumo: undefined }))
              }}
              placeholder="Resumo rápido da visita. Decisões, encaminhamentos, contexto..."
              rows={4}
              className={`w-full rounded-xl border px-4 py-3.5 text-sm text-white bg-[#0d1117] placeholder-[#7D8597] resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 ${
                errors.resumo ? 'border-red-500' : 'border-[#23272F]'
              }`}
            />
            {errors.resumo && <p className="mt-1 text-xs text-red-400">{errors.resumo}</p>}
            <p className="mt-1 text-[10px] text-[#7D8597]">
              Escreva como se fosse uma nota rápida no caderno.
            </p>
          </div>

          {/* Observações opcionais */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Anotação livre
              <span className="ml-1.5 text-[9px] normal-case font-normal">opcional</span>
            </label>
            <textarea
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              placeholder="Lembretes pessoais, impressões, contexto extra..."
              rows={3}
              className="w-full rounded-xl border border-[#23272F] px-4 py-3.5 text-sm text-white bg-[#0d1117] placeholder-[#7D8597] resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40"
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════
          ETAPA 2 — FICOU ALGO ABERTO?
      ════════════════════════════ */}
      {etapa === 2 && (
        <div className="px-4 pt-5 pb-32 space-y-5">

          {/* ── SUGESTÕES DO SISTEMA ── */}
          {sugestoes.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0466C8] px-1">
                Sugeridas pelo sistema ({sugestoes.length})
              </p>
              {sugestoes.map(s => (
                <SugestaoCard
                  key={s.id}
                  s={s}
                  onAceitar={() => aceitarSugestao(s.id)}
                  onEditar={() => editarSugestao(s.id)}
                  onDescartar={() => descartarSugestao(s.id)}
                  onChange={updated => updateSugestao(s.id, updated)}
                />
              ))}
            </section>
          )}

          {/* ── PENDENCIAS CONFIRMADAS/MANUAIS ── */}
          {form.pendencias.length > 0 && (
            <section className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 px-1">
                Confirmadas ({form.pendencias.length})
              </p>
              {form.pendencias.map(p => (
                <PendenciaCard
                  key={p.id}
                  p={p}
                  onChange={updated => updatePendencia(p.id, updated)}
                  onRemove={() => removePendencia(p.id)}
                />
              ))}
            </section>
          )}

          {/* Estado vazio — sem sugestões e sem manuais */}
          {sugestoes.length === 0 && form.pendencias.length === 0 && (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">👍️</p>
              <p className="text-white text-sm font-semibold">Nenhuma pendência</p>
              <p className="text-[#7D8597] text-xs mt-1">Tudo certo? Avance para confirmar.</p>
            </div>
          )}

          {/* Adicionar manualmente */}
          <button
            type="button"
            onClick={addPendencia}
            className="w-full flex items-center justify-center gap-2 bg-[#0d1117] border border-dashed border-[#23272F] rounded-2xl py-4 text-[#7D8597] text-sm active:border-[#0466C8] active:text-[#0466C8] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar manualmente
          </button>
        </div>
      )}

      {/* ════════════════════════════
          ETAPA 3 — CONFIRMAR
      ════════════════════════════ */}
      {etapa === 3 && (
        <div className="px-4 pt-5 pb-32 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7D8597] px-1">
            Resumo do registro
          </p>

          {/* Visita */}
          <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-sm">{nomeCliente}</p>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-900/30 px-2 py-0.5 rounded-lg">
                {form.tipoVisita}
              </span>
            </div>
            <p className="text-[#979DAC] text-xs leading-snug">{form.resumo}</p>
            {form.observacoes && (
              <p className="text-[#7D8597] text-xs italic">{form.observacoes}</p>
            )}
          </div>

          {/* Pendências geradas */}
          {form.pendencias.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#7D8597] px-1 mb-2">
                Pendências geradas ({form.pendencias.length})
              </p>
              <div className="space-y-2">
                {form.pendencias.map(p => {
                  const cor = p.prioridade === 'urgente' ? 'border-red-500' : p.prioridade === 'atencao' ? 'border-amber-400' : 'border-[#23272F]'
                  const label = p.prioridade === 'urgente' ? '→ Modo Caos' : '→ Planejamento'
                  const labelColor = p.prioridade === 'urgente' ? 'text-red-400' : 'text-[#7D8597]'
                  return (
                    <div key={p.id} className={`bg-[#0d1117] border-l-4 ${cor} rounded-r-xl px-4 py-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm flex-1">{p.titulo || '(sem título)'}</p>
                        <span className={`text-[10px] font-bold shrink-0 ${labelColor}`}>{label}</span>
                      </div>
                      {p.prazo && <p className="text-[#7D8597] text-xs mt-0.5">Prazo: {p.prazo}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {form.pendencias.length === 0 && (
            <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-3">
              <p className="text-[#7D8597] text-sm">Nenhuma pendência gerada nessa visita.</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════
          BOTÃO FIXO NO RODAPÉ
      ════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#07090D]/95 backdrop-blur-sm border-t border-[#23272F] px-4 py-4 z-20">
        {etapa === 1 && (
          <button
            type="button"
            onClick={avancarEtapa1}
            className="w-full py-4 rounded-xl text-base font-bold text-white bg-[#0466C8] active:bg-[#0353A4] active:scale-[0.98] transition-all"
          >
            Continuar →
          </button>
        )}

        {etapa === 2 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={avancarEtapa2}
              className="flex-1 py-4 rounded-xl text-sm font-bold text-[#7D8597] bg-[#23272F] active:bg-[#0d1117] transition-all"
            >
              {form.pendencias.length === 0 ? 'Nada em aberto' : 'Pronto'}
            </button>
            <button
              type="button"
              onClick={addPendencia}
              className="flex-1 py-4 rounded-xl text-sm font-bold text-white bg-[#0466C8] active:bg-[#0353A4] transition-all"
            >
              + Adicionar
            </button>
          </div>
        )}

        {etapa === 3 && (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className={`w-full py-4 rounded-xl text-base font-bold text-white transition-all active:scale-[0.98] ${
              saving ? 'bg-[#0466C8]/50' : 'bg-[#0466C8] active:bg-[#0353A4]'
            }`}
          >
            {saving ? 'Salvando...' : 'Registrar visita'}
          </button>
        )}
      </div>

    </main>
  )
}