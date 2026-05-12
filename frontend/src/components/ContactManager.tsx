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
    isPrincipal: false,
    status: 'ativo',
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
        is_principal: formData.isPrincipal,
        telefone_whatsapp: formData.telefone_whatsapp,
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
      <div className="flex items-center justify-between bg-sky-500/5 border border-sky-500/10 p-4 rounded-2xl mb-2">
        <div>
          <p className="text-white text-sm font-bold">Contato Principal</p>
          <p className="text-[10px] text-sky-400 font-medium">Este contato será o ponto focal da instituição.</p>
        </div>
        <button 
          type="button"
          onClick={() => setFormData({ ...formData, isPrincipal: !formData.isPrincipal })}
          className={`w-12 h-6 rounded-full transition-all relative ${formData.isPrincipal ? 'bg-sky-500' : 'bg-zinc-800'}`}
        >
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPrincipal ? 'translate-x-6' : ''}`} />
        </button>
      </div>

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

      <div className="grid grid-cols-2 gap-4 pt-4">
        <button
          type="button"
          onClick={async () => {
             if (confirm('Deseja realmente arquivar este contato?')) {
               setFormData(prev => ({ ...prev, status: 'arquivado' }))
               // O handleSubmit já usa o formData atualizado se chamarmos via ref ou trigger
               // Aqui chamamos uma função de salvar direto para ser limpo
               const traitsStr = selectedTraits.length > 0 ? `[${selectedTraits.join(', ')}] ` : ''
               const finalObs = traitsStr + (formData.observacoes_gerais || '')
               const payload = { ...formData, id_cliente: parseInt(clienteId), status: 'arquivado', observacoes_gerais: finalObs, is_principal: formData.isPrincipal }
               
               setLoading(true)
               if (id) await ContatosService.update(id, payload)
               setLoading(false)
               onSuccess()
               onClose()
             }
          }}
          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]"
        >
          Arquivar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[10px]"
        >
          {loading ? '...' : id ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
