'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClientesService } from '@/services/clientes.service'
import { ContratoService } from '@/services/contrato.service'
import { PendenciasService, type NovaPendenciaInput } from '@/services/pendencias.service'
import { AppError } from '@/utils/errors'

export default function NovaPendenciaPage() {
  const router = useRouter()
  
  const [form, setForm] = useState<NovaPendenciaInput>({
    contratoId: '',
    descricao: '',
    responsavel: '',
    data_prazo: '',
    resolvida: false
  })
  
  const [contratosOpcoes, setContratosOpcoes] = useState<{id: string, label: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [allCli, allCont] = await Promise.all([
          ClientesService.getAll(),
          ContratoService.getAll()
        ])

        if (!isMounted) return

        const activeContratos = allCont.filter(c => c.status === 'ativo')
        const cliMap = new Map(allCli.map(c => [c.id, c.nome_instituicao]))

        const options = activeContratos.map(c => {
          const nome = cliMap.get(c.clienteId) || 'Cliente Desconhecido'
          return {
            id: c.id,
            label: `[${nome}] — ${c.servicos_contratados}`
          }
        }).sort((a, b) => a.label.localeCompare(b.label))

        setContratosOpcoes(options)
      } catch {
        if (isMounted) setError('Erro ao carregar dados de contratos.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await PendenciasService.criar(form)
      router.push('/pendencias')
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message)
      } else {
        setError('Ocorreu um erro inesperado ao salvar a pendência.')
      }
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#07090D] pb-24 text-white">
      {/* ── HEADER SUPERIOR ── */}
      <div className="sticky top-0 z-10 bg-[#07090D]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/pendencias" className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none">
            ‹
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Nova Pendência</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Criar pendência manual e atrelar a um contrato</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Contrato */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Contrato Vinculado *</label>
            <select
              required
              value={form.contratoId}
              onChange={e => setForm({ ...form, contratoId: e.target.value })}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-colors"
            >
              <option value="" disabled>Selecione um contrato...</option>
              {contratosOpcoes.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Descrição da Pendência *</label>
            <textarea
              required
              rows={4}
              placeholder="Ex: Enviar relatório de auditoria final..."
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
            />
          </div>

          {/* Responsável e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Responsável *</label>
              <input
                type="text"
                required
                placeholder="Ex: João Silva"
                value={form.responsavel}
                onChange={e => setForm({ ...form, responsavel: e.target.value })}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Data Limite (Prazo)</label>
              <input
                type="date"
                value={form.data_prazo}
                onChange={e => setForm({ ...form, data_prazo: e.target.value })}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors scheme-dark"
              />
            </div>
          </div>

          {/* Resolvida Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-6 h-6 bg-zinc-900 border border-zinc-700 rounded-md group-hover:border-zinc-500 transition-colors">
                <input
                  type="checkbox"
                  checked={form.resolvida}
                  onChange={e => setForm({ ...form, resolvida: e.target.checked })}
                  className="sr-only"
                />
                {form.resolvida && (
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-white">Marcar como já resolvida</span>
                <p className="text-xs text-zinc-500 mt-0.5">Apenas se você está registrando algo que já foi feito.</p>
              </div>
            </label>
          </div>

          {/* Botões Ação */}
          <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-end gap-3">
            <Link
              href="/pendencias"
              className="px-6 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black px-8 py-3 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {loading ? 'Criando...' : 'Criar Pendência'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}
