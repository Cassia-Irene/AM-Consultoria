'use client'

import { useState, useEffect } from 'react'
import { ContatosService } from '@/services/contatos.service'
import type { Contato } from '@/domain/contato'

interface ContactManagerProps {
  id?: string
  clienteId: string
  onClose: () => void
  onSuccess: () => void
}

const TRAITS = [
  'Resolve rápido',
  'Financeiro lento',
  'Prefere WhatsApp',
  'Exige formalização',
  'Alto desgaste',
  'Alta autonomia',
  'Prioridade Crítica',
  'Baixo Engajamento'
]

export function ContactManager({ id, clienteId, onClose, onSuccess }: ContactManagerProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Contato>>({
    nome: '',
    cargo: '',
    papel: 'Operacional',
    telefone_whatsapp: '',
    email: '',
    observacoes_gerais: ''
  })

  const [selectedTraits, setSelectedTraits] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      const timeout = setTimeout(() => {
        setLoading(true)
        ContatosService.getAll().then(all => {
          const found = all.find(c => c.id === id)
          if (found) {
            setFormData(found)
            // Extrai tags das observações se existirem (ex: [TAG1, TAG2] Texto...)
            const obs = found.observacoes_gerais || ''
            const match = obs.match(/^\[(.*?)\]/)
            if (match) {
              setSelectedTraits(match[1].split(',').map(t => t.trim()))
              setFormData(prev => ({ ...prev, observacoes_gerais: obs.replace(/^\[.*?\]\s*/, '') }))
            }
          }
          setLoading(false)
        })
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [id, clienteId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // Reconstrói observações com tags
      const traitsStr = selectedTraits.length > 0 ? `[${selectedTraits.join(', ')}] ` : ''
      const finalObs = traitsStr + (formData.observacoes_gerais || '')

      const payload = {
        ...formData,
        id_cliente: parseInt(clienteId),
        observacoes_gerais: finalObs,
        telefone: formData.telefone_whatsapp?.trim() || null,
        email: formData.email?.trim() || null,
        cargo: formData.cargo?.trim() || null,
      }

      if (id) {
        await ContatosService.update(id, payload)
      } else {
        await ContatosService.create(payload)
      }
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar contato:', err)
      alert('Erro ao salvar os dados do contato.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    )
  }

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-700"
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block ml-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div>
        <label className={labelClass}>Nome Completo</label>
        <input
          required
          className={inputClass}
          placeholder="Ex: Dra. Maria Silva"
          value={formData.nome || ''}
          onChange={e => setFormData({ ...formData, nome: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cargo / Função</label>
          <input
            className={inputClass}
            placeholder="Ex: Diretora Clínica"
            value={formData.cargo || ''}
            onChange={e => setFormData({ ...formData, cargo: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Papel Operacional</label>
          <select
            className={inputClass}
            value={formData.papel || ''}
            onChange={e => setFormData({ ...formData, papel: e.target.value })}
          >
            <option value="Operacional">Operacional</option>
            <option value="Decisor">Decisor</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Técnico">Técnico</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input
            className={inputClass}
            placeholder="(99) 99999-9999"
            value={formData.telefone_whatsapp || ''}
            onChange={e => setFormData({ ...formData, telefone_whatsapp: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            className={inputClass}
            placeholder="email@instituicao.com.br"
            value={formData.email || ''}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Traços Operacionais (Tags)</label>
        <div className="flex flex-wrap gap-2">
          {TRAITS.map(trait => (
            <button
              key={trait}
              type="button"
              onClick={() => toggleTrait(trait)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                selectedTraits.includes(trait)
                  ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Memória Contextual</label>
        <textarea
          className={inputClass + " h-24 resize-none"}
          placeholder="Notas extras sobre o comportamento ou preferências deste contato..."
          value={formData.observacoes_gerais || ''}
          onChange={e => setFormData({ ...formData, observacoes_gerais: e.target.value })}
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[12px] shadow-lg shadow-sky-900/20"
        >
          {loading ? 'Sincronizando...' : id ? 'Salvar Alterações' : 'Adicionar Contato'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 bg-transparent text-zinc-600 hover:text-zinc-400 font-bold py-2 text-[10px] uppercase tracking-[0.2em] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
