'use client'

import { useState } from 'react'
import { ContratoService } from '@/services/contrato.service'
import { FaturamentosService } from '@/services/faturamento.service'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'

interface ContractCreateManagerProps {
  clienteId: string
  onClose: () => void
  onSuccess: (novoContrato: Contrato) => void
}

export function ContractCreateManager({ clienteId, onClose, onSuccess }: ContractCreateManagerProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [createdContrato, setCreatedContrato] = useState<Contrato | null>(null)
  const [initialFaturamento, setInitialFaturamento] = useState<FaturamentoCliente | null>(null)
  
  const [formData, setFormData] = useState({
    servicosContratados: '',
    valorMensal: '',
    visitasPrevistasMes: '4',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    incluiRelatorio: false,
    observacoesGerais: ''
  })

  const [initialFinanceData, setInitialFinanceData] = useState({
    desconto: '',
    pago: false,
    dataPagamento: new Date().toISOString().split('T')[0]
  })

  const labelClass = 'text-[10px] md:text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3 block'
  const inputClass = 'w-full bg-zinc-900/60 border border-zinc-800 text-zinc-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-sky-500 placeholder-zinc-400 transition-colors'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.servicosContratados.trim()) {
      setErrorMessage('Descreva os serviços contratados.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const valor = parseFloat(formData.valorMensal.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      const visitas = parseInt(formData.visitasPrevistasMes, 10) || 0

      // Chama a mutação de criação no Service
      const contrato = await ContratoService.create({
        clienteId,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim || undefined,
        servicosContratados: formData.servicosContratados,
        visitasPrevistasMes: visitas,
        incluiRelatorio: formData.incluiRelatorio,
        observacoesGerais: formData.observacoesGerais || undefined,
        valorMensal: valor
      })

      setCreatedContrato(contrato)

      // Busca faturamento gerado automaticamente pelo backend
      try {
        const list = await FaturamentosService.getAll(String(contrato.id))
        if (list && list.length > 0) {
          setInitialFaturamento(list[0])
          setStep(2)
        } else {
          onSuccess(contrato)
          onClose()
        }
      } catch {
        onSuccess(contrato)
        onClose()
      }
    } catch (err: unknown) {
      console.error('[CONTRACT_CREATE_MANAGER] Erro ao registrar contrato:', err)
      const errObj = err as Error
      setErrorMessage(errObj.message || 'Falha ao registrar novo contrato. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault()
    if (!createdContrato || !initialFaturamento) return

    setLoading(true)
    try {
      const descVal = parseFloat(initialFinanceData.desconto) || 0
      await FaturamentosService.update(String(initialFaturamento.id), {
        desconto: descVal,
        pago: initialFinanceData.pago,
        data_pagamento: initialFinanceData.pago ? initialFinanceData.dataPagamento : null
      })
      
      onSuccess(createdContrato)
      onClose()
    } catch (err) {
      console.error('[CONTRACT_CREATE_MANAGER] Erro na etapa 2:', err)
      setErrorMessage('Falha ao configurar cobrança inicial. Contrato registrado com sucesso.')
    } finally {
      setLoading(false)
    }
  }

  function handleStep2Skip() {
    if (createdContrato) {
      onSuccess(createdContrato)
    }
    onClose()
  }

  if (step === 2 && createdContrato) {
    return (
      <form onSubmit={handleStep2Submit} className="space-y-6">
        <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-xl p-4 leading-normal">
          <p className="font-bold mb-1">🎉 Contrato Base registrado com sucesso!</p>
          <p className="text-[11px] text-zinc-400">
            Você pode configurar abaixo as condições financeiras específicas para a 1ª cobrança (competência de {initialFaturamento?.mes_ano || 'onboarding'}) ou pular para concluir o cadastro.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3.5 leading-relaxed">
            {errorMessage}
          </div>
        )}

        <div>
          <label className={labelClass}>Desconto Inicial (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            placeholder="Ex: 500,00 (Desconto de implantação)"
            value={initialFinanceData.desconto}
            onChange={e => setInitialFinanceData({ ...initialFinanceData, desconto: e.target.value })}
          />
          <p className="text-zinc-500 text-[10px] mt-1.5 leading-normal">
            Desconto de cortesia ou onboarding aplicado apenas na primeira cobrança.
          </p>
        </div>

        <div>
          <label className={labelClass}>Liquidação Imediata</label>
          <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
            <input
              type="checkbox"
              id="initial-payment-pago"
              className="w-4 h-4 rounded border-zinc-800 text-emerald-500 bg-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              checked={initialFinanceData.pago}
              onChange={e => setInitialFinanceData({ ...initialFinanceData, pago: e.target.checked })}
            />
            <label htmlFor="initial-payment-pago" className="text-xs text-zinc-300 font-bold select-none cursor-pointer">
              Marcar primeira mensalidade como PAGA
            </label>
          </div>
        </div>

        {initialFinanceData.pago && (
          <div>
            <label className={labelClass}>Data do Pagamento</label>
            <input
              type="date"
              required
              className={inputClass}
              value={initialFinanceData.dataPagamento}
              onChange={e => setInitialFinanceData({ ...initialFinanceData, dataPagamento: e.target.value })}
            />
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800/50 flex gap-3">
          <button
            type="button"
            onClick={handleStep2Skip}
            disabled={loading}
            className="flex-1 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold py-4 rounded-xl transition-colors text-[11px] uppercase tracking-widest bg-transparent"
          >
            Pular / Concluir
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-950/20"
          >
            {loading ? 'Configurando...' : 'Aplicar & Concluir'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3.5 leading-relaxed">
          {errorMessage}
        </div>
      )}

      <div>
        <label className={labelClass}>Serviços Contratados</label>
        <textarea
          className={inputClass + ' h-20 resize-none'}
          placeholder="Ex: Consultoria em Gestão Pública, Auditorias Financeiras e Treinamentos de Liderança..."
          value={formData.servicosContratados}
          onChange={e => setFormData({ ...formData, servicosContratados: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Valor Mensal (R$)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Ex: 4500,00"
            value={formData.valorMensal}
            onChange={e => setFormData({ ...formData, valorMensal: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Visitas Mensais</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            placeholder="Ex: 4"
            value={formData.visitasPrevistasMes}
            onChange={e => setFormData({ ...formData, visitasPrevistasMes: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Data Início</label>
          <input
            type="date"
            className={inputClass}
            value={formData.dataInicio}
            onChange={e => setFormData({ ...formData, dataInicio: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Data Fim (Opcional)</label>
          <input
            type="date"
            className={inputClass}
            value={formData.dataFim}
            onChange={e => setFormData({ ...formData, dataFim: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Relatório Mensal</label>
        <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
          <input
            type="checkbox"
            id="new-contract-report"
            className="w-4 h-4 rounded border-zinc-800 text-sky-500 bg-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            checked={formData.incluiRelatorio}
            onChange={e => setFormData({ ...formData, incluiRelatorio: e.target.checked })}
          />
          <label htmlFor="new-contract-report" className="text-xs text-sky-500 font-bold select-none cursor-pointer">
            Exigir entrega de relatório técnico mensal
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Observações Gerais</label>
        <textarea
          className={inputClass + ' h-24 resize-none'}
          placeholder="Anotações internas sobre as tratativas contratuais, aditivos ou particularidades..."
          value={formData.observacoesGerais}
          onChange={e => setFormData({ ...formData, observacoesGerais: e.target.value })}
        />
      </div>

      <div className="pt-4 border-t border-zinc-800/50 space-y-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black mb-4 py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-widest text-[12px] shadow-lg shadow-sky-900/20"
        >
          {loading ? 'Registrando...' : 'Registrar Novo Contrato'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold py-3.5 rounded-xl transition-colors text-[11px] uppercase tracking-widest bg-transparent"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

