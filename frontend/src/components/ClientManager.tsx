'use client'

import { useState, useEffect } from 'react'
import { ClientesService } from '@/services/clientes.service'
import type { Cliente } from '@/domain/cliente'

interface ClientManagerProps {
  id?: string
  onClose: () => void
  onSuccess: () => void
}

export function ClientManager({ id, onClose, onSuccess }: ClientManagerProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome_instituicao: '',
    tipo_instituicao: '',
    cidade: '',
    nivel_complexidade: 'baixo',
    status: 'ativo',
    observacoes_gerais: ''
  })

  useEffect(() => {
    if (id) {
      const timeout = setTimeout(() => {
        setLoading(true)
        ClientesService.getById(id).then(data => {
          if (data) setFormData(data)
          setLoading(false)
        })
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (id) {
        await ClientesService.update(id, formData)
      } else {
        await ClientesService.create(formData)
      }
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Erro ao salvar cliente:', err)
      alert('Erro ao salvar os dados do cliente.')
    } finally {
      setLoading(false)
    }
  }

  const labelClass = "text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3 block ml-1"
  const inputClass = "w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-500"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Nome da Instituição</label>
        <input
          required
          className={inputClass}
          placeholder="Ex: APAE Bacabal"
          value={formData.nome_instituicao || ''}
          onChange={e => setFormData({ ...formData, nome_instituicao: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo</label>
          <select
            className={inputClass}
            value={formData.tipo_instituicao || ''}
            onChange={e => setFormData({ ...formData, tipo_instituicao: e.target.value })}
          >
            <option value="">Selecione...</option>
            <option value="Hospital">Hospital</option>
            <option value="Clínica">Clínica</option>
            <option value="Home Care">Home Care</option>
            <option value="Poder Público">Poder Público</option>
            <option value="ONG / Filantropia">ONG / Filantropia</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Cidade</label>
          <input
            className={inputClass}
            placeholder="Ex: São Luís"
            value={formData.cidade || ''}
            onChange={e => setFormData({ ...formData, cidade: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Nível de Complexidade Operacional</label>
        <div className="grid grid-cols-3 gap-2">
          {['baixa', 'média', 'alta'].map(nivel => (
            <button
              key={nivel}
              type="button"
              onClick={() => setFormData({ ...formData, nivel_complexidade: nivel })}
              className={`py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest border transition-all ${
                formData.nivel_complexidade === nivel 
                  ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-900/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {nivel}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Memória Contextual / Observações</label>
        <textarea
          className={inputClass + " h-32 resize-none"}
          placeholder="Notas sobre a dinâmica da instituição, processos específicos ou particularidades do contrato..."
          value={formData.observacoes_gerais || ''}
          onChange={e => setFormData({ ...formData, observacoes_gerais: e.target.value })}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[12px] shadow-lg shadow-sky-900/20"
        >
          {loading ? 'Sincronizando...' : id ? 'Atualizar Prontuário' : 'Cadastrar Instituição'}
        </button>
      </div>
    </form>
  )
}
