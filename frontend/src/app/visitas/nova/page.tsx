'use client'

import { useState, useEffect, useMemo, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { VisitasService } from '@/services/visitas.service'
import { RotateCcw, Plus, AlertTriangle, Calendar, Clock, ArrowLeft } from 'lucide-react'
import type { Cliente } from '@/domain/cliente'
import type { Contrato } from '@/domain/contrato'
import type { StatusVisita, ModalidadeVisita, TipoVisita } from '@/domain/visita'

interface PendenciaGerada {
  id: string
  descricao: string
  data_prazo: string     // YYYY-MM-DD
  responsavel: string
}

interface PendenciaSugerida extends PendenciaGerada {
  gatilho: string
  scoreBase: number
}

interface Regra {
  palavras: string[]
  negadores?: string[]
  descricao: string
  diasAFrente: number
  gatilho: string
  scoreBase: number
}

const REGRAS: Regra[] = [
  {
    palavras: ['anvisa', 'vigilância', 'vigilancia', 'sanitária', 'sanitaria', 'inspecão', 'inspecao', 'vistoria', 'auditoria'],
    negadores: ['aprovado', 'aprovada', 'ok', 'passou', 'liberado', 'liberada'],
    descricao: 'Pendência ANVISA',
    diasAFrente: 3,
    gatilho: 'ANVISA',
    scoreBase: 0.9,
  },
  {
    palavras: ['relatório', 'relatorio', 'laudo', 'documentar', 'documentação', 'documentacao'],
    negadores: ['enviou', 'enviado', 'mandou', 'entregou', 'pronto', 'concluído', 'concluido'],
    descricao: 'Enviar relatório',
    diasAFrente: 7,
    gatilho: 'relatório',
    scoreBase: 0.8,
  },
  {
    palavras: ['contrato', 'renovação', 'renovacao', 'assinatura'],
    negadores: ['assinou', 'assinado', 'fechou', 'fechado', 'renovado'],
    descricao: 'Resolver pendência contratual',
    diasAFrente: 5,
    gatilho: 'contrato',
    scoreBase: 0.75,
  },
  {
    palavras: ['fatura', 'pagamento', 'boleto', 'cobrança', 'cobranca', 'cobrar', 'pagar', 'inadimplente', 'inadimplência', 'vencido', 'vencida'],
    negadores: ['pagou', 'pago', 'quitou', 'quitado', 'regularizado'],
    descricao: 'Regularizar pagamento',
    diasAFrente: 2,
    gatilho: 'pagamento',
    scoreBase: 0.9,
  },
  {
    palavras: ['treinamento', 'capacitação', 'capacitacao', 'capacitar', 'treinar'],
    negadores: ['fez', 'feito', 'realizado', 'concluído', 'concluido'],
    descricao: 'Agendar treinamento com equipe',
    diasAFrente: 14,
    gatilho: 'treinamento',
    scoreBase: 0.7,
  },
  {
    palavras: ['retorno', 'reagendar', 'próxima visita', 'proxima visita', 'voltar lá', 'agendar', 'marcar visita', 'pediu pra voltar', 'pediu retorno'],
    negadores: ['cancelou', 'cancelado', 'não quer', 'não precisa'],
    descricao: 'Agendar próxima visita',
    diasAFrente: 7,
    gatilho: 'retorno',
    scoreBase: 0.65,
  },
  {
    palavras: ['alvará', 'alvara', 'licença', 'licenca'],
    negadores: ['renovado', 'regularizado', 'em dia'],
    descricao: 'Renovar alvará/licença',
    diasAFrente: 10,
    gatilho: 'alvará',
    scoreBase: 0.8,
  },
  {
    palavras: [
      'equipe', 'funcionários', 'funcionarios', 'colaborador', 'colaboradores',
      'alinhar', 'alinhamento', 'comunicar', 'comunicado', 'reunir', 'reunião',
    ],
    negadores: ['resolvido', 'alinhado', 'alinhada'],
    descricao: 'Alinhar com equipe do cliente',
    diasAFrente: 3,
    gatilho: 'equipe',
    scoreBase: 0.65,
  },
  {
    palavras: [
      'paciente', 'residente', 'idoso', 'cuidado', 'cuidador', 'enfermagem',
      'medico', 'médico', 'saúde', 'saude', 'medicamento', 'prontuário', 'prontuario',
      'ocorrência', 'ocorrencia', 'incidente',
    ],
    negadores: ['resolvido', 'resolvida', 'estavel', 'estável'],
    descricao: 'Acompanhar situação do paciente/residente',
    diasAFrente: 2,
    gatilho: 'paciente',
    scoreBase: 0.7,
  },
  {
    palavras: ['cliente pediu', 'pediu para', 'solicitou', 'precisa de', 'está esperando', 'aguardando'],
    negadores: ['não precisa', 'cancelou', 'desistiu'],
    descricao: 'Atender solicitação do cliente',
    diasAFrente: 3,
    gatilho: 'solicitação',
    scoreBase: 0.65,
  },
]

const BOOSTS_URGENTE = ['urgente', 'urgência', 'urgencia', 'crítico', 'critico', 'imediato', 'imediata', 'emergencia', 'emergência']
const THRESHOLD_PRE_ACEITAR = 0.7
const JANELA_BOOST = 60

function prazoEmDiasISO(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

function formatarDataBR(isoDate: string): string {
  if (!isoDate) return ''
  const [ano, mes, dia] = isoDate.split('-')
  return `${dia}/${mes}/${ano}`
}

function temBoostProximo(texto: string, gatilho: string): boolean {
  const idx = texto.indexOf(gatilho.toLowerCase())
  if (idx === -1) return false
  const inicio = Math.max(0, idx - JANELA_BOOST)
  const fim = Math.min(texto.length, idx + gatilho.length + JANELA_BOOST)
  const janela = texto.slice(inicio, fim)
  return BOOSTS_URGENTE.some(b => janela.includes(b))
}

function temBoostGlobal(texto: string): boolean {
  const count = BOOSTS_URGENTE.filter(b => texto.includes(b)).length
  return count >= 2
}

function sugerirPendencias(resumo: string): PendenciaSugerida[] {
  const texto = resumo.toLowerCase()
  const boostGlobal = temBoostGlobal(texto)
  const sugestoes: PendenciaSugerida[] = []

  for (const regra of REGRAS) {
    const match = regra.palavras.some(p => texto.includes(p))
    if (!match) continue

    const negado = regra.negadores?.some(n => texto.includes(n)) ?? false
    if (negado) continue

    const boostLocal = temBoostProximo(texto, regra.gatilho)
    const comBoost = boostGlobal || boostLocal
    const scoreFinal = comBoost ? Math.min(regra.scoreBase + 0.15, 1) : regra.scoreBase
    const diasFinal = comBoost ? Math.max(1, Math.ceil(regra.diasAFrente * 0.5)) : regra.diasAFrente

    sugestoes.push({
      id: Math.random().toString(36).slice(2, 9),
      descricao: regra.descricao,
      data_prazo: prazoEmDiasISO(diasFinal),
      responsavel: 'Equipe Cliente',
      gatilho: regra.gatilho,
      scoreBase: scoreFinal,
    })
  }

  return sugestoes
}

interface FormState {
  clienteId: string
  contratoId: string
  projetoId: string
  status: StatusVisita
  tipo_visita: TipoVisita
  modalidade: ModalidadeVisita
  duracao_minutos: number
  data_hora: string
  descricao: string
  resultados: string
  pendencias: PendenciaGerada[]
}

const DRAFT_KEY = 'am_consultoria_visita_draft_v2'

const INITIAL_FORM: FormState = {
  clienteId: '',
  contratoId: '',
  projetoId: '',
  status: 'realizada',
  tipo_visita: 'rotineira',
  modalidade: 'presencial',
  duracao_minutos: 60,
  data_hora: new Date().toISOString().slice(0, 16),
  descricao: '',
  resultados: '',
  pendencias: [],
}

export default function NovaVisitaPage() {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sugestoes, setSugestoes] = useState<PendenciaSugerida[]>([])
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)
  
  // Rastrear gatilhos que o usuário removeu manualmente para evitar reinserção automática
  const [gatilhosDescartados, setGatilhosDescartados] = useState<string[]>([])

  const [showDraftNotice, setShowDraftNotice] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  // Carrega rascunho de forma segura no cliente para evitar Hydration Mismatch
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (!savedDraft) return
    try {
      const draft = JSON.parse(savedDraft)
      if (draft.clienteId || draft.descricao || draft.resultados || (draft.pendencias && draft.pendencias.length > 0)) {
        Promise.resolve().then(() => {
          setForm(draft)
          setShowDraftNotice(true)
        })
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [allContratos, setAllContratos] = useState<Contrato[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        const [cli, cont] = await Promise.all([
          ClientesService.getAll(),
          ContratoService.getAll()
        ])
        if (isMounted) {
          setAllClientes(cli.filter(c => c.status === 'ativo'))
          setAllContratos(cont)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [])

  // Auto-save silencioso debounced
  useEffect(() => {
    if (!form.clienteId && !form.descricao && !form.resultados) return
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    }, 500)
    return () => clearTimeout(timer)
  }, [form])

  // Processar sugestões de pendências inline conforme o usuário digita (Debounced)
  useEffect(() => {
    if (!form.descricao.trim()) {
      Promise.resolve().then(() => {
        setSugestoes([])
      })
      return
    }

    const timer = setTimeout(() => {
      const todas = sugerirPendencias(form.descricao)

      // Identificar pre-aceitas (>= 0.7) e opcionais (< 0.7)
      const preAceitas = todas.filter(s => s.scoreBase >= THRESHOLD_PRE_ACEITAR && !gatilhosDescartados.includes(s.gatilho))
      const opcionais = todas.filter(s => s.scoreBase < THRESHOLD_PRE_ACEITAR && !gatilhosDescartados.includes(s.gatilho))

      // Injetar pré-aceitas no formulário sem duplicar
      if (preAceitas.length > 0) {
        setForm(f => {
          const novas = [...f.pendencias]
          let mudou = false
          preAceitas.forEach(pa => {
            if (!novas.some(n => n.descricao.toLowerCase() === pa.descricao.toLowerCase())) {
              novas.push({
                id: pa.id,
                descricao: pa.descricao,
                data_prazo: pa.data_prazo,
                responsavel: pa.responsavel
              })
              mudou = true
            }
          })
          return mudou ? { ...f, pendencias: novas } : f
        })
      }

      // Filtrar sugestões opcionais que ainda não estão nas pendências salvas
      setSugestoes(opcionais.filter(op => 
        !form.pendencias.some(p => p.descricao.toLowerCase() === op.descricao.toLowerCase())
      ))
    }, 600)

    return () => clearTimeout(timer)
  }, [form.descricao, gatilhosDescartados, form.pendencias])

  const descartarDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setForm(INITIAL_FORM)
    setShowDraftNotice(false)
    setGatilhosDescartados([])
  }

  function aceitarSugestao(id: string) {
    const s = sugestoes.find(s => s.id === id)
    if (!s) return
    setForm(f => ({
      ...f,
      pendencias: [...f.pendencias, { id: s.id, descricao: s.descricao, data_prazo: s.data_prazo, responsavel: s.responsavel }]
    }))
    setSugestoes(ss => ss.filter(s => s.id !== id))
  }

  function descartarSugestao(id: string, gatilho?: string) {
    if (gatilho) {
      setGatilhosDescartados(prev => [...prev, gatilho])
    }
    setSugestoes(ss => ss.filter(s => s.id !== id))
  }

  function removePendencia(id: string, descricao: string) {
    // Mapear descrição de volta a regra de gatilho para ignorar futuras sugestões automáticas idênticas
    const regra = REGRAS.find(r => r.descricao.toLowerCase() === descricao.toLowerCase())
    if (regra) {
      setGatilhosDescartados(prev => [...prev, regra.gatilho])
    }
    setForm(f => ({ ...f, pendencias: f.pendencias.filter(p => p.id !== id) }))
  }

  function updatePendencia(id: string, changes: Partial<PendenciaGerada>) {
    setForm(f => ({ ...f, pendencias: f.pendencias.map(p => p.id === id ? { ...p, ...changes } : p) }))
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    
    // Validação rápida
    const eMap: typeof errors = {}
    if (!form.clienteId) eMap.clienteId = 'Selecione o cliente'
    if (!form.contratoId) eMap.contratoId = 'Selecione o contrato'
    if (!form.descricao.trim()) eMap.descricao = 'Descreva o que aconteceu'
    if (form.status === 'realizada' && !form.resultados.trim()) eMap.resultados = 'Descreva os resultados'
    
    setErrors(eMap)
    if (Object.keys(eMap).length > 0) {
      const primeiroErro = Object.values(eMap)[0]
      setErrorSubmit(primeiroErro)
      return
    }

    setSaving(true)
    setErrorSubmit(null)

    try {
      await VisitasService.criar({
        clienteId: form.clienteId,
        contratoId: form.contratoId,
        status: form.status,
        tipo_visita: form.tipo_visita,
        modalidade: form.modalidade,
        duracao_minutos: form.duracao_minutos,
        data_hora: form.data_hora,
        descricao: form.descricao,
        resultados: form.resultados,
        pendencias: form.pendencias.map(p => ({
          descricao: p.descricao,
          data_prazo: p.data_prazo,
          responsavel: p.responsavel,
        })),
      })

      setSaving(false)
      setSaved(true)
      localStorage.removeItem(DRAFT_KEY)
    } catch (error: unknown) {
      console.error('[ERROR][API] Erro ao submeter visita:', error)
      setSaving(false)
      const msg = error instanceof Error ? error.message : 'Ocorreu um erro ao salvar. Tente novamente.'
      setErrorSubmit(msg)
    }
  }

  const nomeCliente = allClientes.find(c => c.id === form.clienteId)?.nome_instituicao ?? ''
  
  const contratosDoCliente = useMemo(() => {
    return form.clienteId ? allContratos.filter(c => c.clienteId === form.clienteId) : []
  }, [form.clienteId, allContratos])

  // Auto-selecionar contrato único do cliente
  useEffect(() => {
    if (contratosDoCliente.length === 1 && !form.contratoId) {
      const id = contratosDoCliente[0].id
      Promise.resolve().then(() => {
        setForm(f => ({ ...f, contratoId: id }))
      })
    }
  }, [contratosDoCliente, form.contratoId])

  if (saved) {
    const total = form.pendencias.length
    return (
      <main className="min-h-screen bg-[#07090D] flex flex-col items-center justify-center px-6 text-center">
        <div className="size-16 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center mb-5">
          <span className="text-emerald-400 text-3xl">✓</span>
        </div>
        <p className="text-white text-xl font-bold mb-1">Visita registrada</p>
        <p className="text-zinc-500 text-sm mb-6">{nomeCliente}</p>

        {total > 0 && (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 text-left w-full max-w-sm mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Pendências Geradas ({total})</p>
            <div className="space-y-2">
              {form.pendencias.map(p => (
                <div key={p.id} className="text-xs">
                  <p className="text-zinc-200 font-bold leading-snug">• {p.descricao}</p>
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5 ml-2">Prazo: {formatarDataBR(p.data_prazo)} · {p.responsavel}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#0466C8] hover:bg-[#0353A4] text-white font-bold py-4 rounded-xl transition-colors"
          >
            Voltar ao Início
          </button>
          <button
            onClick={() => router.push(`/clientes/${form.clienteId}`)}
            className="w-full bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-900 text-zinc-400 font-bold py-4 rounded-xl transition-colors"
          >
            Ver Timeline do Cliente
          </button>
          <button
            onClick={() => {
              setSaved(false)
              setForm(INITIAL_FORM)
              setSugestoes([])
              setGatilhosDescartados([])
            }}
            className="w-full text-zinc-600 text-xs font-black uppercase tracking-widest py-3 hover:text-zinc-400 transition-colors"
          >
            Registrar outra visita
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#07090D] text-zinc-300 pb-32">
      {/* HEADER DE AÇÃO */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between border-b border-zinc-900/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="size-8 flex items-center justify-center rounded-xl bg-zinc-900/40 border border-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-white text-base font-black tracking-tight">Nova Visita</h1>
            <p className="text-zinc-600 text-[10px] uppercase tracking-wider font-bold">Relato e Ação Direta</p>
          </div>
        </div>
      </div>

      {showDraftNotice && (
        <div className="mx-5 mt-5 bg-sky-950/20 border border-sky-800/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-sky-600/10 flex items-center justify-center shrink-0">
              <RotateCcw size={14} className="text-sky-400" />
            </div>
            <div>
              <p className="text-white text-xs font-bold">Rascunho recuperado</p>
              <p className="text-zinc-600 text-[9px] uppercase tracking-wider font-bold">Preenchimento não finalizado</p>
            </div>
          </div>
          <button 
            onClick={descartarDraft}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] uppercase tracking-widest font-black text-sky-400 border border-white/5 transition-colors"
          >
            Descartar
          </button>
        </div>
      )}

      {errorSubmit && (
        <div className="mx-5 mt-5 bg-red-950/20 border border-red-900/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-xs font-bold">Atenção</p>
            <p className="text-zinc-400 text-xs mt-0.5">{errorSubmit}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-5 mt-6 space-y-6">
        
        {/* CLIENTE & CONTRATO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Cliente *</label>
            <select
              value={form.clienteId}
              onChange={e => {
                setForm(f => ({ ...f, clienteId: e.target.value, contratoId: '' }))
                setErrors(er => ({ ...er, clienteId: undefined }))
              }}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-white bg-zinc-950 focus:outline-none focus:border-[#0466C8] transition-colors ${
                errors.clienteId ? 'border-red-900' : 'border-zinc-800/80'
              }`}
            >
              <option value="">Selecione o cliente...</option>
              {allClientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome_instituicao}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Contrato Vinculado *</label>
            <select
              value={form.contratoId}
              onChange={e => {
                setForm(f => ({ ...f, contratoId: e.target.value }))
                setErrors(er => ({ ...er, contratoId: undefined }))
              }}
              disabled={!form.clienteId}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-white bg-zinc-950 focus:outline-none focus:border-[#0466C8] disabled:opacity-40 transition-colors ${
                errors.contratoId ? 'border-red-900' : 'border-zinc-800/80'
              }`}
            >
              <option value="">Selecione o contrato...</option>
              {contratosDoCliente.map(c => (
                <option key={c.id} value={c.id}>{c.servicos_contratados}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RELATO CENTRAL (FOCO TOTAL) */}
        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">O que aconteceu? (Relato Principal) *</label>
            <textarea
              autoFocus
              value={form.descricao}
              onChange={e => {
                setForm(f => ({ ...f, descricao: e.target.value }))
                setErrors(er => ({ ...er, descricao: undefined }))
              }}
              rows={4}
              placeholder="Descreva a visita. Ex: Inspeção sanitária mensal na cozinha. Identificado estoque sem identificação de validade..."
              className={`w-full bg-zinc-950 rounded-xl border px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-[#0466C8] resize-none transition-colors ${
                errors.descricao ? 'border-red-900' : 'border-zinc-800/80'
              }`}
            />
          </div>

          {form.status === 'realizada' && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Resultados Detalhados *</label>
              <textarea
                value={form.resultados}
                onChange={e => {
                  setForm(f => ({ ...f, resultados: e.target.value }))
                  setErrors(er => ({ ...er, resultados: undefined }))
                }}
                rows={3}
                placeholder="Ex: Treinado manipuladores sobre descarte imediato. Lixeira sem pedal marcada para troca..."
                className={`w-full bg-zinc-950 rounded-xl border px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-[#0466C8] resize-none transition-colors ${
                  errors.resultados ? 'border-red-900' : 'border-zinc-800/80'
                }`}
              />
            </div>
          )}
        </div>

        {/* PENDÊNCIAS & AÇÕES GERADAS INLINE */}
        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Pendências e Ações Geradas</h3>
            <p className="text-[10px] text-zinc-600 mt-1">Conforme você relata, pendências com score alto são salvas automaticamente. Outras aparecem como sugestões.</p>
          </div>

          {/* Lista de Inclusas */}
          {form.pendencias.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Já Inclusas ({form.pendencias.length})</p>
              <div className="grid grid-cols-1 gap-2">
                {form.pendencias.map(p => (
                  <div key={p.id} className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={p.descricao}
                        onChange={e => updatePendencia(p.id, { descricao: e.target.value })}
                        className="w-full bg-transparent text-white text-xs font-bold focus:outline-none border-b border-dashed border-zinc-800 focus:border-zinc-700 pb-1"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded text-[10px]">
                          <span className="text-zinc-600 font-bold uppercase tracking-widest">Prazo:</span>
                          <input
                            type="date"
                            value={p.data_prazo}
                            onChange={e => updatePendencia(p.id, { data_prazo: e.target.value })}
                            className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded text-[10px]">
                          <span className="text-zinc-600 font-bold uppercase tracking-widest">Responsável:</span>
                          <select
                            value={p.responsavel}
                            onChange={e => updatePendencia(p.id, { responsavel: e.target.value })}
                            className="bg-transparent text-zinc-300 focus:outline-none"
                          >
                            <option value="Equipe Cliente" className="bg-zinc-950">Equipe Cliente</option>
                            <option value="AM Consultoria" className="bg-zinc-950">AM Consultoria</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendencia(p.id, p.descricao)}
                      className="size-6 rounded-lg bg-zinc-900/60 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões Opcionais (Opt-in) */}
          {sugestoes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-900/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0466C8]">Adicionar também? ({sugestoes.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sugestoes.map(s => (
                  <div key={s.id} className="bg-zinc-950/30 border border-zinc-900/80 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white text-xs font-bold truncate">{s.descricao}</p>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">Prazo: {formatarDataBR(s.data_prazo)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => aceitarSugestao(s.id)}
                        className="px-2.5 py-1 rounded bg-[#0466C8]/10 hover:bg-[#0466C8]/20 border border-[#0466C8]/20 text-[#0466C8] text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        + Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => descartarSugestao(s.id, s.gatilho)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Inclusão Manual */}
          <button
            type="button"
            onClick={() => {
              setForm(f => ({
                ...f,
                pendencias: [
                  ...f.pendencias,
                  {
                    id: Math.random().toString(36).slice(2, 9),
                    descricao: '',
                    data_prazo: prazoEmDiasISO(5),
                    responsavel: 'Equipe Cliente'
                  }
                ]
              }))
            }}
            className="w-full py-3.5 border border-dashed border-zinc-800/80 rounded-xl hover:border-zinc-700 text-zinc-500 hover:text-zinc-400 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={12} /> Escrever pendência manual
          </button>
        </div>

        {/* DETALHES ADICIONAIS (CONTINUIDADE NATURAL - COMPACTOS E PRÉ-PREENCHIDOS) */}
        <div className="bg-zinc-900/10 border border-zinc-900/40 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Detalhes de Execução (Opcionais)</h3>
            <p className="text-[10px] text-zinc-700">Preenchidos por padrão para máxima agilidade. Altere se necessário.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusVisita }))}
                className="w-full bg-zinc-950 rounded-xl border border-zinc-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0466C8]"
              >
                <option value="realizada">Concluída</option>
                <option value="agendada">Agendada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">Tipo de Visita</label>
              <select
                value={form.tipo_visita}
                onChange={e => setForm(f => ({ ...f, tipo_visita: e.target.value as TipoVisita }))}
                className="w-full bg-zinc-950 rounded-xl border border-zinc-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0466C8]"
              >
                <option value="rotineira">Rotineira</option>
                <option value="urgente">Urgente</option>
                <option value="pontual">Pontual</option>
                <option value="estruturada">Estruturada</option>
                <option value="acompanhamento direcionado">Direcionada</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5">Modalidade</label>
              <select
                value={form.modalidade}
                onChange={e => setForm(f => ({ ...f, modalidade: e.target.value as ModalidadeVisita }))}
                className="w-full bg-zinc-950 rounded-xl border border-zinc-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0466C8]"
              >
                <option value="presencial">Presencial</option>
                <option value="remota">Remota</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 flex items-center gap-1">
                <Calendar size={10} /> Data e Hora
              </label>
              <input
                type="datetime-local"
                value={form.data_hora}
                onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-zinc-950 rounded-xl border border-zinc-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0466C8] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1.5 flex items-center gap-1">
                <Clock size={10} /> Duração (minutos)
              </label>
              <input
                type="number"
                value={form.duracao_minutos}
                onChange={e => setForm(f => ({ ...f, duracao_minutos: Number(e.target.value) }))}
                className="w-full bg-zinc-950 rounded-xl border border-zinc-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0466C8]"
              />
            </div>
          </div>
        </div>

        {/* BOTÃO FIXO/FINAL DE ENVIO */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-[0.99] ${
              saving 
                ? 'bg-sky-600/40 text-sky-300' 
                : 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/10'
            }`}
          >
            {saving ? 'Registrando Visita...' : 'Registrar Visita'}
          </button>
        </div>

      </form>
    </main>
  )
}