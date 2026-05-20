import React, { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Save, Info, AlertTriangle, Tag, History, CheckCircle2, Trash2 } from 'lucide-react'
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
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [history, setHistory] = useState<AuditEntry[]>(historyResumo)
  const [deletingTimestamp, setDeletingTimestamp] = useState<string | null>(null)

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

  const handleDelete = async (timestamp: string) => {
    if (!confirm('Deseja realmente excluir este registro de auditoria?')) return
    
    setDeletingTimestamp(timestamp)
    try {
      const success = await ProjetosService.deleteAuditoria(projetoId, timestamp)
      if (success) {
        setHistory(prev => prev.filter(h => h.timestamp !== timestamp))
        onUpdate()
      } else {
        alert('Falha ao excluir registro.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao excluir registro.')
    } finally {
      setDeletingTimestamp(null)
    }
  }

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

  // Verifica se há texto escrito além das tags automáticas
  const hasValidText = text.replace(/\[.*?\]/g, '').trim().length > 0

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
            <h3 className="text-[12px] font-black uppercase text-purple-500 mb-0.5">Governança Operacional</h3>
            <p className="text-sm font-bold text-white">{showHistory ? 'Histórico de Intervenções' : 'Contexto e Overrides'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2.5 rounded-xl border transition-all ${showHistory ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 hover:bg-purple-500/5 hover:border-purple-500/10 text-white hover:text-purple-500'}`}
            title="Alternar entre edição e histórico"
          >
            {showHistory ? <MessageSquare size={16} /> : <History size={16} />}
          </button>
          
          {!showHistory && (
            <button
              onClick={handleSave}
              disabled={isSaving || !hasValidText}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                saveSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : (isSaving || !hasValidText)
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/30'
              }`}
              title={!hasValidText ? "Adicione uma justificativa narrativa para salvar" : ""}
            >
              {saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saveSuccess ? 'Salvo' : isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] md:text-[12px] text-amber-500 uppercase font-black tracking-widest mb-4">Log de Auditabilidade</p>
          <div className="space-y-4">
            {history.length > 0 ? (
              <>
                {(showAllHistory ? history : history.slice(0, 3)).map((item, idx) => (
                  <HistoryItem 
                    key={idx}
                    user={item.user} 
                    date={new Date(item.timestamp).toLocaleString('pt-BR')} 
                    timestamp={item.timestamp}
                    isDeleting={deletingTimestamp === item.timestamp}
                    onDelete={handleDelete}
                    action={item.audit_type === 'governance_intervention' ? 'Override Contextual' : 'Ajuste Factual'} 
                    detail={Object.keys(item.changes).map(k => `${k}: ${item.changes[k].para}`).join(', ')} 
                  />
                ))}
                {history.length > 3 && (
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-zinc-400 hover:text-white text-[10px] uppercase font-black tracking-widest pl-2 mt-4 transition-colors cursor-pointer block w-full text-left"
                  >
                    {showAllHistory ? "- Ocultar registros adicionais" : `+ ${history.length - 3} registros arquivados`}
                  </button>
                )}
              </>
            ) : (
              <div className="p-10 text-center border border-dashed border-white/5 rounded-3xl">
                <p className="text-[9px] text-zinc-400 uppercase font-black">Nenhum registro encontrado.</p>
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
            <div className="text-[10px] md:text-[12px] text-zinc-200 leading-relaxed">
              <span className="font-black text-blue-300 uppercase mr-2">Governance:</span>
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
              className="flex-1 w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs leading-relaxed text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all resize-none shadow-inner font-medium"
            />
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-purple-500 italic uppercase font-black tracking-widest">
          <AlertTriangle size={14} className="text-purple-500" />
          <span>Essencial para Rastreabilidade</span>
        </div>
      </div>
    </div>
  )
}

function QuickTag({ label, tag, onClick, color }: { label: string, tag: string, onClick: (t: string) => void, color: 'rose' | 'sky' | 'amber' | 'emerald' }) {
  const colors = {
    rose: 'hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-400 hover:text-rose-400',
    sky: 'hover:bg-sky-500/20 hover:border-sky-500/30 text-sky-400 hover:text-sky-400',
    amber: 'hover:bg-amber-500/20 hover:border-amber-500/30 text-amber-400 hover:text-amber-400',
    emerald: 'hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-400',
  }
  
  return (
    <button 
      onClick={() => onClick(tag)}
      className={`px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${colors[color]}`}
    >
      <Tag size={10} className="inline mr-1.5 mb-0.5" />
      {label}
    </button>
  )
}

function HistoryItem({ 
  user, date, action, detail, timestamp, isDeleting, onDelete 
}: { 
  user: string, date: string, action: string, detail: string, timestamp: string, isDeleting?: boolean, onDelete?: (ts: string) => void 
}) {
  return (
    <div className={`bg-white/5 border border-white/5 rounded-2xl p-3 space-y-1 hover:bg-white/10 transition-all ${isDeleting ? 'opacity-50 scale-95 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest">{action}</p>
        <div className="flex items-center gap-3">
          <span className="text-[8px] md:text-[9px] text-zinc-300 font-bold">{date}</span>
          {onDelete && (
             <button 
               onClick={() => onDelete(timestamp)}
               className="text-rose-500 hover:text-rose-400 transition-colors"
               title="Excluir Registro"
               disabled={isDeleting}
             >
               <Trash2 size={14} />
             </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-white font-medium">{detail}</p>
      <div className="flex items-center gap-1.5 pt-1">
        <div className="w-1 h-1 rounded-full bg-amber-500" />
        <span className="text-[8px] md:text-[9px] text-zinc-300 uppercase font-black">Autor: {user}</span>
      </div>
    </div>
  )
}
