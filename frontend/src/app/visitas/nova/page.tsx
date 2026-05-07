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
import { getClientes } from '@/mappers/cliente.mapper'
import { getContratos } from '@/mappers/contrato.mapper'
import { VisitasService } from '../../../services/visitas.service'

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

import type { TipoVisitaUI, StatusVisitaUI, ModalidadeVisitaUI } from '@/adapters/visita.adapter'

interface PendenciaGerada {
  id: string
  descricao: string
  data_prazo: string     // YYYY-MM-DD
  responsavel: string
}

/** Sugestão gerada automaticamente pelo sistema a partir do resumo */
interface PendenciaSugerida extends PendenciaGerada {
  gatilho: string
  estado: 'pendente' | 'editando'
  scoreBase: number  // 0–1: confiança da sugestão; >= 0.7 → pré-aceita
}

interface FormState {
  clienteId: string
  contratoId: string
  status: StatusVisitaUI
  tipo_visita: TipoVisitaUI
  modalidade: ModalidadeVisitaUI
  duracao_minutos: number
  data_hora: string
  descricao: string
  resultados: string
  pendencias: PendenciaGerada[]
}

type Etapa = 1 | 2 | 3

interface Regra {
  palavras: string[]
  /**
   * Palavras que CANCELAM a sugestão mesmo que o gatilho bata.
   * Ex: "contrato" bate, mas "assinou" indica que já foi resolvido.
   */
  negadores?: string[]
  descricao: string
  diasAFrente: number
  gatilho: string
  /**
   * Score base de confiança (0–1).
   * >= 0.7 → pré-aceita automaticamente (opt-out)
   * < 0.7  → aparece como sugestão opcional (opt-in)
   */
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
    // 'documento' removido — ambíguo demais ("o cliente pediu um documento" ≠ pendência)
    negadores: ['enviou', 'enviado', 'mandou', 'entregou', 'pronto', 'concluído', 'concluido'],
    descricao: 'Enviar relatório',
    diasAFrente: 7,
    gatilho: 'relatório',
    scoreBase: 0.8,
  },
  {
    palavras: ['contrato', 'renovação', 'renovacao', 'assinatura'],
    // 'assinar'/'assinou' removidos — indicam conclusão, não pendência
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
    // Intenção implícita: "pedir", "marcar", "combinar" indicam ação futura
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
    // Equipe: qualquer mencao é suficiente para sugerir alinhamento
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
    // Saúde: contexto comum em clientes como Lar São Francisco e APAE
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
    // Solicitações diretas do cliente são ações implícitas
    palavras: ['cliente pediu', 'pediu para', 'solicitou', 'precisa de', 'está esperando', 'aguardando'],
    negadores: ['não precisa', 'cancelou', 'desistiu'],
    descricao: 'Atender solicitação do cliente',
    diasAFrente: 3,
    gatilho: 'solicitação',
    scoreBase: 0.65,
  },
]

/**
 * Palavras de urgência CIRURGICAS.
 * Em vez de elevar tudo, só elevam a regra cujo gatilho está próximo no texto.
 * A proximidade é definida por uma janela de 40 caracteres antes/depois do boost.
 */
const BOOSTS_URGENTE = [
  'urgente', 'urgência', 'urgencia', 'crítico', 'critico',
  'imediato', 'imediata', 'emergencia', 'emergência',
  // Removido 'prazo' — muito ambíguo, causa boost em contextos informativos
]

/** Score mínimo para pré-aceitar (aparecer como "Já inclusa"). Abaixo disso → sugestão opcional */
const THRESHOLD_PRE_ACEITAR = 0.7

/** Janela de caracteres para considerar boost de urgência cirúrgico */
const JANELA_BOOST = 60

function prazoEmDiasISO(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

/**
 * Verifica se existe um boost de urgencia PROXIMO ao gatilho no texto.
 * Evita elevar toda a lista quando a palavra "urgente" aparece em outro contexto.
 */
function temBoostProximo(texto: string, gatilho: string): boolean {
  const idx = texto.indexOf(gatilho.toLowerCase())
  if (idx === -1) return false
  const inicio = Math.max(0, idx - JANELA_BOOST)
  const fim    = Math.min(texto.length, idx + gatilho.length + JANELA_BOOST)
  const janela = texto.slice(inicio, fim)
  return BOOSTS_URGENTE.some(b => janela.includes(b))
}

/** Boost global: quando o texto inteiro é claramente de urgência */
function temBoostGlobal(texto: string): boolean {
  // Só aplica boost global se houver 2+ palavras de urgência no texto
  const count = BOOSTS_URGENTE.filter(b => texto.includes(b)).length
  return count >= 2
}

function sugerirPendencias(resumo: string): PendenciaSugerida[] {
  const texto = resumo.toLowerCase()
  const boostGlobal = temBoostGlobal(texto)
  const sugestoes: PendenciaSugerida[] = []

  for (const regra of REGRAS) {
    // 1. Verifica se algum gatilho batóu
    const match = regra.palavras.some(p => texto.includes(p))
    if (!match) continue

    // 2. Verifica negadores: se o contexto indica que já foi resolvido, ignora
    const negado = regra.negadores?.some(n => texto.includes(n)) ?? false
    if (negado) continue

    // 3. Calcula boost de urgência cirúrgico
    const boostLocal = temBoostProximo(texto, regra.gatilho)
    const comBoost   = boostGlobal || boostLocal

    // 4. Score final (boost sobe o score, dando mais chances de pré-aceitar)
    const scoreFinal = comBoost ? Math.min(regra.scoreBase + 0.15, 1) : regra.scoreBase

    // 5. Ajusta prazo se for urgente
    const diasFinal = comBoost ? Math.max(1, Math.ceil(regra.diasAFrente * 0.5)) : regra.diasAFrente

    sugestoes.push({
      id: uid(),
      descricao: regra.descricao,
      data_prazo: prazoEmDiasISO(diasFinal),
      responsavel: 'Equipe Técnica', // Padrão
      gatilho: regra.gatilho,
      estado: 'pendente',
      // score utilizado pelo chamador para separar opt-out vs opt-in
      scoreBase: scoreFinal,
    })
  }

  return sugestoes
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

const clientesAtivos = getClientes().filter(c => c.status === 'ativo')

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────── */

function AdicionarPendenciaInline({ onAdd, variant = 'dashed' }: { onAdd: (p: PendenciaGerada) => void, variant?: 'dashed' | 'primary' }) {
  const [descricao, setDescricao] = useState('')
  const [diasAFrente, setDiasAFrente] = useState(5)
  const [aberto, setAberto] = useState(false)

  function submeter() {
    if (!descricao.trim()) return
    onAdd({
      id: Math.random().toString(36).slice(2, 9),
      descricao: descricao.trim(),
      data_prazo: prazoEmDiasISO(diasAFrente),
      responsavel: 'Equipe Técnica',
    })
    setDescricao('')
    setDiasAFrente(5)
    setAberto(false)
  }

  if (!aberto) {
    if (variant === 'primary') {
      return (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#0466C8] rounded-xl py-3 text-white text-sm font-bold active:bg-[#0353A4] transition-colors"
        >
          + Adicionar pendência
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-[#23272F] rounded-2xl py-3.5 text-[#0466C8] text-sm font-semibold active:border-[#0466C8]/60 active:bg-[#0466C8]/5 transition-colors"
      >
        <span className="text-lg leading-none">+</span> Escrever pendência
      </button>
    )
  }

  return (
    <div className="bg-[#0d1117] border border-[#0466C8]/40 rounded-2xl px-4 py-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0466C8]">Nova pendência</p>

      <input
        type="text"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submeter()}
        placeholder="O que ficou em aberto?"
        autoFocus
        className="w-full bg-transparent text-white text-sm placeholder-[#7D8597] border-b border-[#23272F] pb-2 focus:outline-none focus:border-[#0466C8] transition-colors"
      />

      <div className="flex gap-2 items-center">
        <span className="text-[10px] text-[#7D8597] shrink-0">Dias p/ prazo:</span>
        <input
          type="number"
          value={diasAFrente}
          onChange={e => setDiasAFrente(Number(e.target.value))}
          min={0}
          className="w-20 bg-[#23272F] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0466C8]"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => setAberto(false)}
          className="flex-1 py-2.5 rounded-xl text-sm text-[#7D8597] bg-[#23272F] active:opacity-70 transition-opacity">
          Cancelar
        </button>
        <button type="button" onClick={submeter} disabled={!descricao.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0466C8] disabled:opacity-40 active:bg-[#0353A4] transition-colors">
          Adicionar
        </button>
      </div>
    </div>
  )
}

/** Card editável para pendências já incluídas — toque para expandir e editar */
function PendenciaEditavel({
  p,
  onChange,
  onRemove,
}: {
  p: PendenciaGerada
  onChange: (changes: Partial<PendenciaGerada>) => void
  onRemove: () => void
}) {
  const [expandido, setExpandido] = useState(false)

  const urgencia = (new Date(p.data_prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  const isUrgente = urgencia < 2
  const cColor = isUrgente ? 'border-red-500' : 'border-[#23272F]'
  const dColor = isUrgente ? 'text-red-400' : 'text-[#7D8597]'

  if (!expandido) {
    return (
      <div
        className={`flex items-center gap-3 bg-[#0d1117] border-l-4 ${cColor} rounded-r-xl px-4 py-3 active:bg-[#161b22] transition-colors cursor-pointer`}
        onClick={() => setExpandido(true)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{p.descricao || '(sem descrição)'}</p>
          <p className={`text-[10px] font-bold ${dColor}`}>Prazo: {new Date(p.data_prazo).toLocaleDateString('pt-BR')} · Resp: {p.responsavel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#7D8597] text-[10px]">editar</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="text-[#7D8597] active:text-red-400 text-lg leading-none"
          >×</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-[#0d1117] border-l-4 ${cColor} rounded-r-xl px-4 py-4 space-y-3`}>
      {/* Descrição */}
      <input
        type="text"
        value={p.descricao}
        onChange={e => onChange({ descricao: e.target.value })}
        placeholder="O que ficou pendente?"
        autoFocus
        className="w-full bg-transparent text-white text-sm font-semibold placeholder-[#7D8597] border-b border-[#23272F] pb-2 focus:outline-none focus:border-[#0466C8] transition-colors"
      />

      {/* Prazo */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#7D8597] shrink-0">Prazo:</span>
        <input
          type="date"
          value={p.data_prazo}
          onChange={e => onChange({ data_prazo: e.target.value })}
          className="flex-1 bg-[#23272F] text-white text-xs rounded-lg px-3 py-1.5 placeholder-[#7D8597] focus:outline-none focus:ring-1 focus:ring-[#0466C8]"
        />
      </div>

      {/* Responsável */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-[#7D8597] shrink-0">Resp:</span>
        <input
          type="text"
          value={p.responsavel}
          onChange={e => onChange({ responsavel: e.target.value })}
          className="flex-1 bg-[#23272F] text-white text-xs rounded-lg px-3 py-1.5 placeholder-[#7D8597] focus:outline-none focus:ring-1 focus:ring-[#0466C8]"
        />
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onRemove}
          className="px-4 py-2 rounded-xl text-xs text-red-400 bg-red-900/20 active:bg-red-900/40 transition-colors"
        >
          Remover
        </button>
        <button
          type="button"
          onClick={() => setExpandido(false)}
          className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-[#0466C8] active:bg-[#0353A4] transition-colors"
        >
          Pronto
        </button>
      </div>
    </div>
  )
}

/** Indicador de etapas no topo */
function EtapaIndicador({ atual }: { atual: Etapa }) {
  const etapas = [
    { num: 1, label: 'Resumo' },
    { num: 2, label: 'Pendências' },
    { num: 3, label: 'Confirmar' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 px-2 py-3 border-b border-[#23272F]">
      {etapas.map((e, i) => (
        <div key={e.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`size-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
              e.num < atual
                ? 'bg-emerald-500 text-white'
                : e.num === atual
                  ? 'bg-[#0466C8] text-white'
                  : 'bg-[#23272F] text-white'
            }`}>
              {e.num < atual ? '✓' : e.num}
            </div>
            <p className={`text-[12px] mt-1 font-medium whitespace-nowrap px-1 ${
              e.num === atual ? 'text-[#0466C8]' : 'text-white'
            }`}>
              {e.label}
            </p>
          </div>
          
          {i < etapas.length - 1 && (
            <div className={`w-8 h-px mx-1 -mt-4 transition-colors ${
              e.num < atual ? 'bg-emerald-500' : 'bg-[#23272F]'
            }`} />
          )}
        </div>
      ))}
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
  /**
   * Opção C: UI + log.
   * True quando o backend confirmou a visita mas NÃO retornou pendencias_ids,
   * indicando que as pendências foram enviadas mas não persistidas.
   * Remove quando pendencia.py estiver implementado no backend.
   */
  const [pendenciasWarning, setPendenciasWarning] = useState(false)

  const [errorSubmit, setErrorSubmit] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    clienteId: '',
    contratoId: '',
    status: 'realizada',
    tipo_visita: 'rotina',
    modalidade: 'presencial',
    duracao_minutos: 60,
    data_hora: new Date().toISOString().slice(0, 16),
    descricao: '',
    resultados: '',
    pendencias: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  /* ── navegação entre etapas ── */
  function avancarEtapa1() {
    const e: typeof errors = {}
    if (!form.clienteId) e.clienteId = 'Selecione o cliente'
    if (!form.contratoId) e.contratoId = 'Selecione o contrato'
    if (!form.descricao.trim()) e.descricao = 'Descreva brevemente o que aconteceu'
    if (form.status === 'realizada' && !form.resultados.trim()) e.resultados = 'Informe os resultados'
    setErrors(e)
    if (Object.keys(e).length === 0) {
      if (sugestoes.length === 0) {
        const todas = sugerirPendencias(form.descricao)
        
        // Agora usamos o Score de Confiança para decidir o Opt-out
        // >= THRESHOLD_PRE_ACEITAR (0.7) → Entra direto como "Já inclusa"
        // < 0.7 → Fica como sugestão opcional (chip)
        const paraIncluir = todas.filter(s => s.scoreBase >= THRESHOLD_PRE_ACEITAR)
        const paraSugerir = todas.filter(s => s.scoreBase < THRESHOLD_PRE_ACEITAR)

        if (paraIncluir.length > 0) {
          setForm(f => ({ 
            ...f, 
            pendencias: [
              ...f.pendencias, 
              ...paraIncluir.map(s => ({ 
                id: s.id, 
                descricao: s.descricao, 
                data_prazo: s.data_prazo, 
                responsavel: s.responsavel 
              }))
            ] 
          }))
        }
        setSugestoes(paraSugerir)
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
    setForm(f => ({ ...f, pendencias: [...f.pendencias, { id: s.id, descricao: s.descricao, data_prazo: s.data_prazo, responsavel: s.responsavel }] }))
    setSugestoes(ss => ss.filter(s => s.id !== id))
  }

  function descartarSugestao(id: string) {
    setSugestoes(ss => ss.filter(s => s.id !== id))
  }

  function removePendencia(id: string) {
    setForm(f => ({ ...f, pendencias: f.pendencias.filter(p => p.id !== id) }))
  }

  function updatePendencia(id: string, changes: Partial<PendenciaGerada>) {
    setForm(f => ({ ...f, pendencias: f.pendencias.map(p => p.id === id ? { ...p, ...changes } : p) }))
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    setSaving(true)
    setErrorSubmit(null)

    try {
      // O componente passa dados brutos. O service → adapter decide o formato da API.
      const response = await VisitasService.criar({
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

      // Detecta ausência de persistência de pendências na resposta
      const enviouPendencias = form.pendencias.length > 0
      const backendConfirmou = Array.isArray(response.pendencias_ids) && response.pendencias_ids.length > 0
      const shouldWarn = enviouPendencias && !backendConfirmou

      if (shouldWarn) {
        // BACKEND_DEPENDENCY: remover quando pendencia.py estiver implementado
        console.warn(
          '[WARN] Pendências não persistidas pelo backend.',
          `Enviadas: ${form.pendencias.length}. Confirmadas: ${response.pendencias_ids?.length ?? 0}.`,
          'Aguardando implementação de pendencia.py no backend.'
        )
        setPendenciasWarning(true)
      }

      setSaving(false)
      setSaved(true)
      // Usa variável local — state async pode não refletir o valor atualizado aqui
      setTimeout(() => router.push('/dashboard'), shouldWarn ? 3000 : 1400)
    } catch (error: unknown) {
      console.error('[ERROR][API] Erro ao submeter visita:', error)
      setSaving(false)
      const msg = error instanceof Error ? error.message : 'Ocorreu um erro ao salvar. Tente novamente.'
      setErrorSubmit(msg)
    }
  }

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const nomeCliente = clientesAtivos.find(c => c.id === form.clienteId)?.nome_instituicao ?? ''
  
  const contratosDoCliente = form.clienteId 
    ? getContratos().filter(c => c.clienteId === form.clienteId) 
    : []

  /* ────────── TELA DE CONFIRMAÇÃO ────────── */
  if (saved) {
    const urgentes = form.pendencias.filter(p => {
      const urgencia = (new Date(p.data_prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      return urgencia < 2
    }).length
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

        {/* Aviso não bloqueante: pendências enviadas mas não confirmadas pelo backend */}
        {pendenciasWarning && total > 0 && (
          <div className="mt-4 w-full max-w-sm bg-amber-950/40 border border-amber-700/50 rounded-2xl px-4 py-3 text-left">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">⚠ Aviso</p>
            <p className="text-amber-300/80 text-sm">
              Visita registrada, mas as {total} pendência{total > 1 ? 's' : ''} ainda não foram salvas.
            </p>
            <p className="text-amber-500/60 text-xs mt-1">
              Funcionalidade em implantação no servidor.
            </p>
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

      {errorSubmit && (
        <div className="mx-4 mt-4 bg-red-950/40 border border-red-700/50 rounded-xl px-4 py-3 text-red-400 text-sm">
          <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Erro</p>
          {errorSubmit}
        </div>
      )}

      {/* ════════════════════════════
          ETAPA 1 — O QUE ACONTECEU
      ════════════════════════════ */}
      {etapa === 1 && (
        <div className="justify-center px-4 pt-5 pb-32 space-y-5">

          {/* Cliente */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Cliente *
            </label>
            <select
              value={form.clienteId}
              onChange={e => {
                setForm(f => ({ ...f, clienteId: e.target.value, contratoId: '' }))
                setErrors(er => ({ ...er, clienteId: undefined }))
              }}
              className={`w-full rounded-xl border px-4 py-3.5 text-base text-white bg-[#0d1117] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 ${
                errors.clienteId ? 'border-red-500' : 'border-[#23272F]'
              }`}
            >
              <option value="" className="bg-[#0d1117]">Selecione o cliente...</option>
              {clientesAtivos.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0d1117]">{c.nome_instituicao}</option>
              ))}
            </select>
            {errors.clienteId && <p className="mt-1 text-xs text-red-400">{errors.clienteId}</p>}
          </div>

          {/* Contrato Vinculado */}
          {form.clienteId && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
                Contrato Vinculado *
              </label>
              <select
                value={form.contratoId}
                onChange={e => {
                  setForm(f => ({ ...f, contratoId: e.target.value }))
                  setErrors(er => ({ ...er, contratoId: undefined }))
                }}
                className={`w-full rounded-xl border px-4 py-3.5 text-base text-white bg-[#0d1117] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 ${
                  errors.contratoId ? 'border-red-500' : 'border-[#23272F]'
                }`}
              >
                <option value="" className="bg-[#0d1117]">Selecione o contrato...</option>
                {contratosDoCliente.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0d1117]">{c.servicos_contratados}</option>
                ))}
              </select>
              {errors.contratoId && <p className="mt-1 text-xs text-red-400">{errors.contratoId}</p>}
            </div>
          )}

          {/* Status da Visita */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Status *
            </label>
            <div className="flex gap-2">
              {(['agendada', 'realizada', 'cancelada'] as StatusVisitaUI[]).map(status => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setForm(f => ({ ...f, status: status }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                    form.status === status
                      ? 'bg-[#001845] text-white border-[#0466C8]'
                      : 'bg-[#0d1117] text-[#7D8597] border-[#23272F]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de visita */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Tipo
            </label>
            <div className="flex gap-2">
              {(['rotina', 'extra', 'projeto'] as TipoVisitaUI[]).map(tipo => (
                <button
                  type="button"
                  key={tipo}
                  onClick={() => setForm(f => ({ ...f, tipo_visita: tipo }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                    form.tipo_visita === tipo
                      ? 'bg-[#001845] text-white border-[#0466C8]'
                      : 'bg-[#0d1117] text-[#7D8597] border-[#23272F]'
                  }`}
                >
                  {tipo}
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
              value={form.descricao}
              onChange={e => {
                setForm(f => ({ ...f, descricao: e.target.value }))
                setErrors(er => ({ ...er, descricao: undefined }))
              }}
              rows={3}
              placeholder="Ex: Inspeção sanitária mensal na cozinha e refeitório..."
              className={`w-full rounded-xl border px-4 py-3.5 text-base text-white bg-[#0d1117] placeholder-[#7D8597] focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 resize-none ${
                errors.descricao ? 'border-red-500' : 'border-[#23272F]'
              }`}
            />
            {errors.descricao && <p className="mt-1 text-xs text-red-400">{errors.descricao}</p>}
          </div>

          {/* Resultados detalhados */}
          {form.status === 'realizada' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
                Resultados *
              </label>
              <textarea
                value={form.resultados}
                onChange={e => {
                  setForm(f => ({ ...f, resultados: e.target.value }))
                  setErrors(er => ({ ...er, resultados: undefined }))
                }}
                rows={4}
                placeholder="Ex: Tudo conforme, exceto lixeiras sem pedal..."
                className={`w-full rounded-xl border px-4 py-3.5 text-base text-white bg-[#0d1117] placeholder-[#7D8597] focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 resize-none ${
                  errors.resultados ? 'border-red-500' : 'border-[#23272F]'
                }`}
              />
              {errors.resultados && <p className="mt-1 text-xs text-red-400">{errors.resultados}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Data da Visita */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
                Data *
              </label>
              <input
                type="datetime-local"
                value={form.data_hora}
                onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))}
                style={{ colorScheme: 'dark' }}
                className="w-full rounded-xl border border-[#23272F] px-4 py-3.5 text-base text-white bg-[#0d1117] focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40 transition-all cursor-pointer"
              />
            </div>
            
            {/* Duração Estimada */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
                Duração (min)
              </label>
              <input
                type="number"
                value={form.duracao_minutos}
                onChange={e => setForm(f => ({ ...f, duracao_minutos: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[#23272F] px-4 py-3.5 text-base text-white bg-[#0d1117] focus:outline-none focus:ring-2 focus:ring-[#0466C8]/40"
              />
            </div>
          </div>

          {/* Modalidade */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#7D8597] mb-2">
              Modalidade
            </label>
            <div className="flex gap-2">
              {(['presencial', 'online'] as const).map(mod => (
                <button
                  type="button"
                  key={mod}
                  onClick={() => setForm(f => ({ ...f, modalidade: mod }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                    form.modalidade === mod
                      ? 'bg-[#001845] text-white border-[#0466C8]'
                      : 'bg-[#0d1117] text-[#7D8597] border-[#23272F]'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
          </div>
      )}

      {/* ════════════════════════════
          ETAPA 2 — FICOU ALGO ABERTO?
      ════════════════════════════ */}
      {etapa === 2 && (
        <div className="px-4 pt-5 pb-32 space-y-5">

          {/* ── BLOCO 1: JÁ VÃO SER SALVAS (pré-aceitas, opt-out, editáveis) ── */}
          {form.pendencias.length > 0 && (
            <section>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 px-1 mb-2">
                Ações detectadas — já inclusas ({form.pendencias.length})
              </p>
              <p className="text-[10px] text-[#7D8597] px-1 mb-3">Toque para editar · × para remover.</p>
              <div className="space-y-2">
                {form.pendencias.map(p => (
                  <PendenciaEditavel
                    key={p.id}
                    p={p}
                    onChange={changes => updatePendencia(p.id, changes)}
                    onRemove={() => removePendencia(p.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── BLOCO 2: SUGESTÕES OPCIONAIS (atenção/normal — chips) ── */}
          {sugestoes.length > 0 && (
            <section>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0466C8] px-1 mb-2">
                Adicionar também? ({sugestoes.length})
              </p>
              <div className="space-y-2">
                {sugestoes.map(s => {
                  const urgencia = (new Date(s.data_prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  const isUrgente = urgencia < 2
                  const dest   = isUrgente ? '→ Planejamento hoje' : '→ Planejamento'
                  const dColor = isUrgente ? 'text-amber-400' : 'text-[#7D8597]'
                  return (
                    <div key={s.id} className="flex items-center gap-3 bg-[#0d1117] border border-[#23272F] rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{s.descricao}</p>
                        <p className={`text-[10px] font-bold ${dColor}`}>{dest} · {new Date(s.data_prazo).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => aceitarSugestao(s.id)}
                          className="text-emerald-400 text-xs font-bold bg-emerald-900/30 px-3 py-1.5 rounded-lg active:bg-emerald-900/60">+ Sim</button>
                        <button type="button" onClick={() => descartarSugestao(s.id)}
                          className="text-[#7D8597] text-xs font-bold bg-[#23272F] px-3 py-1.5 rounded-lg active:opacity-60">Não</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Estado vazio + adicionar manualmente */}
          {sugestoes.length === 0 && form.pendencias.length === 0 && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <p className="text-2xl mb-3">✏️</p>
                <p className="text-white text-sm font-bold">Nada detectado no resumo</p>
                <p className="text-[#7D8597] text-[10px] mt-1.5 leading-relaxed">
                  O sistema não encontrou palavras-chave<br />
                  Adicione a pendência manualmente abaixo.
                </p>
              </div>
              <AdicionarPendenciaInline 
                variant="primary" 
                onAdd={p => setForm(f => ({ ...f, pendencias: [...f.pendencias, p] }))} 
              />
            </div>
          )}

          {/* Link discreto para adicionar mais, quando já há itens */}
          {(sugestoes.length > 0 || form.pendencias.length > 0) && (
            <AdicionarPendenciaInline onAdd={p => setForm(f => ({ ...f, pendencias: [...f.pendencias, p] }))} />
          )}
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
          <div className="bg-[#0d1117] border border-[#23272F] rounded-2xl px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-sm">{nomeCliente}</p>
              <div className="flex gap-1">
                <span className="text-[10px] font-bold text-sky-400 bg-sky-900/30 px-2 py-0.5 rounded-lg capitalize">
                  {form.tipo_visita}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-lg capitalize">
                  {form.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8597] mb-0.5">Descrição</p>
              <p className="text-[#979DAC] text-xs leading-snug">{form.descricao}</p>
            </div>
            {form.status === 'realizada' && form.resultados && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7D8597] mb-0.5">Resultados</p>
                <p className="text-[#979DAC] text-xs leading-snug">{form.resultados}</p>
              </div>
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
                  const urgencia = (new Date(p.data_prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  const isUrgente = urgencia < 2
                  const cor = isUrgente ? 'border-red-500' : 'border-[#23272F]'
                  const label = isUrgente ? '→ Modo Caos' : '→ Planejamento'
                  const labelColor = isUrgente ? 'text-red-400' : 'text-[#7D8597]'
                  return (
                    <div key={p.id} className={`bg-[#0d1117] border-l-4 ${cor} rounded-r-xl px-4 py-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm flex-1">{p.descricao || '(sem descrição)'}</p>
                        <span className={`text-[10px] font-bold shrink-0 ${labelColor}`}>{label}</span>
                      </div>
                      {p.data_prazo && <p className="text-[#7D8597] text-xs mt-0.5">Prazo: {new Date(p.data_prazo).toLocaleDateString('pt-BR')}</p>}
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
          <button
            type="button"
            onClick={avancarEtapa2}
            className="w-full py-4 rounded-xl text-base font-bold text-white bg-[#0466C8] active:bg-[#0353A4] active:scale-[0.98] transition-all"
          >
            {form.pendencias.length === 0 ? 'Nada em aberto' : 'Pronto'}
          </button>
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