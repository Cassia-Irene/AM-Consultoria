import React, { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Save, Info, AlertTriangle, Tag, History, CheckCircle2 } from 'lucide-react'
import { ProjetosService, AuditEntry } from '@/services/projetos.service'

interface Props {
  projetoId: string
  observacoes?: string
  historyResumo?: AuditEntry[]
  onUpdate: () => void
}

export function ProjectOperationalOverrides({ 
  projetoId, 
  observacoes = '', 
  historyResumo = [],
  onUpdate 
}: Props) {
  const [text, setText] = useState(observacoes)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [history, setHistory] = useState<AuditEntry[]>(historyResumo)

  useEffect(() => {
    Promise.resolve().then(() => {
      setText(observacoes)
      if (historyResumo.length > 0) {
        setHistory([...historyResumo].reverse())
      }
    })
  }, [observacoes, historyResumo])

  const loadHistory = useCallback(async () => {
    try {
      const data = await ProjetosService.getAuditoria(projetoId)
      setHistory([...data].reverse()) // Mais recentes primeiro
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    }
  }, [projetoId])

  useEffect(() => {
    if (showHistory) {
      Promise.resolve().then(() => loadHistory())
    }
  }, [showHistory, loadHistory])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await ProjetosService.update(projetoId, {
        observacoes_gerais: text
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      onUpdate()
      if (showHistory) loadHistory()
    } catch (err) {
      console.error('Erro ao salvar governança:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const insertTag = (tag: string) => {
    setText(prev => `${prev}\n${tag}`.trim())
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col h-full shadow-2xl relative overflow-hidden transition-all duration-500">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${showHistory ? 'bg-amber-500/10 border-amber-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
            {showHistory ? <History size={18} className="text-amber-400" /> : <MessageSquare size={18} className="text-purple-400" />}
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Governança Operacional</h3>
            <p className="text-xs font-bold text-white/80">{showHistory ? 'Histórico de Intervenções' : 'Contexto e Overrides'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2.5 rounded-xl border transition-all ${showHistory ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
            title="Alternar entre edição e histórico"
          >
            {showHistory ? <MessageSquare size={16} /> : <History size={16} />}
          </button>
          
          {!showHistory && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                saveSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : isSaving 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/30'
              }`}
            >
              {saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saveSuccess ? 'Salvo' : isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-4">Log de Auditabilidade</p>
          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((item, idx) => (
                <HistoryItem 
                  key={idx}
                  user={item.user} 
                  date={new Date(item.timestamp).toLocaleString('pt-BR')} 
                  action={item.audit_type === 'governance_intervention' ? 'Override Contextual' : 'Ajuste Factual'} 
                  detail={Object.keys(item.changes).map(k => `${k}: ${item.changes[k].para}`).join(', ')} 
                />
              ))
            ) : (
              <div className="p-10 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-[9px] text-zinc-600 uppercase font-black">Nenhum registro encontrado.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Dica de Uso */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 mb-5 flex gap-3 items-center group/tip relative z-10 transition-all hover:bg-blue-500/10">
            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400 group-hover/tip:scale-110 transition-transform">
              <Info size={14} />
            </div>
            <div className="text-[10px] text-blue-100/40 leading-relaxed">
              <span className="font-black text-blue-300/60 uppercase mr-2 tracking-tighter">Governance:</span>
              Use tags para modular a inteligência interpretativa sem alterar a realidade factual.
            </div>
          </div>

          {/* Toolbar de Ações Rápidas */}
          <div className="flex flex-wrap gap-2 mb-3 relative z-10">
            <QuickTag label="Pausa" tag="[OVERRIDE_FASE:pausa]" onClick={insertTag} color="rose" />
            <QuickTag label="Recuperação" tag="[OVERRIDE_FASE:recuperação]" onClick={insertTag} color="sky" />
            <QuickTag label="Lento" tag="[OVERRIDE_RITMO:lento]" onClick={insertTag} color="amber" />
            <QuickTag label="Estável" tag="[OVERRIDE_RITMO:nominal]" onClick={insertTag} color="emerald" />
          </div>

          {/* Textarea */}
          <div className="flex-1 flex flex-col min-h-[150px] relative z-10">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Registre o contexto operacional ou aplique overrides narrativos..."
              className="flex-1 w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs leading-relaxed text-zinc-300 placeholder-white/5 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all resize-none shadow-inner font-medium"
            />
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-[9px] text-white/20 italic uppercase font-black tracking-widest">
          <AlertTriangle size={12} className="text-amber-500/50" />
          <span>Rastreabilidade Ativa: {showHistory ? 'Visualizando Histórico' : 'Modo Governança'}</span>
        </div>
        <div className="text-[9px] font-black text-white/10 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-lg">
          v2.0 Beta
        </div>
      </div>
    </div>
  )
}

function QuickTag({ label, tag, onClick, color }: { label: string, tag: string, onClick: (t: string) => void, color: 'rose' | 'sky' | 'amber' | 'emerald' }) {
  const colors = {
    rose: 'hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-400/60 hover:text-rose-400',
    sky: 'hover:bg-sky-500/20 hover:border-sky-500/30 text-sky-400/60 hover:text-sky-400',
    amber: 'hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-400/60 hover:text-amber-400',
    emerald: 'hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-400/60 hover:text-emerald-400',
  }
  
  return (
    <button 
      onClick={() => onClick(tag)}
      className={`px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest transition-all ${colors[color]}`}
    >
      <Tag size={10} className="inline mr-1.5 mb-0.5 opacity-50" />
      {label}
    </button>
  )
}

function HistoryItem({ user, date, action, detail }: { user: string, date: string, action: string, detail: string }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1 hover:bg-white/10 transition-colors cursor-default">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest">{action}</p>
        <span className="text-[8px] text-zinc-600 font-bold">{date}</span>
      </div>
      <p className="text-[11px] text-zinc-300 font-medium">{detail}</p>
      <div className="flex items-center gap-1.5 pt-1">
        <div className="w-1 h-1 rounded-full bg-amber-500" />
        <span className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Autor: {user}</span>
      </div>
    </div>
  )
}
