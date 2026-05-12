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

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors placeholder:text-zinc-700"
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block ml-1"

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Complexidade</label>
          <select
            className={inputClass}
            value={formData.nivel_complexidade || ''}
            onChange={e => setFormData({ ...formData, nivel_complexidade: e.target.value })}
          >
            <option value="baixo">Baixo</option>
            <option value="medio">Médio</option>
            <option value="alto">Alto</option>
            <option value="critico">Crítico</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={formData.status || ''}
            onChange={e => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo / Encerrado</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Observações Operacionais (Contexto)</label>
        <textarea
          className={inputClass + " h-32 resize-none"}
          placeholder="Notas sobre a dinâmica da instituição, processos específicos ou particularidades do contrato..."
          value={formData.observacoes_gerais || ''}
          onChange={e => setFormData({ ...formData, observacoes_gerais: e.target.value })}
        />
      </div>

      <div className={`grid ${id ? 'grid-cols-2' : 'grid-cols-1'} gap-4 pt-4`}>
        {id && (
          <button
            type="button"
            onClick={async () => {
              if (confirm('Deseja realmente desativar esta instituição? Ela será movida para o arquivo histórico.')) {
                setLoading(true)
                try {
                  await ClientesService.update(id, { ...formData, status: 'inativo' })
                  onSuccess()
                  onClose()
                } catch {
                  alert('Erro ao desativar cliente.')
                } finally {
                  setLoading(false)
                }
              }
            }}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]"
          >
            Arquivar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[10px]"
        >
          {loading ? '...' : id ? 'Salvar' : 'Criar Cliente'}
        </button>
      </div>
    </form>
  )
}
