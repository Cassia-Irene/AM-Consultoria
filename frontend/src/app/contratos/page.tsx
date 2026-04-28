'use client'
// app/contratos/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '../../components/StatusBadge'
import { Contratos } from '../../lib/mocks'

export default function ContratosPage() {
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const contratos = mostrarInativos
    ? Contratos
    : Contratos.filter(c => c.status === 'ativo')

  const totalReceber = contratos
    .filter(c => c.faturamentoMes.status === 'pendente')
    .reduce((sum, c) => sum + c.faturamentoMes.valor, 0)

  const totalPago = contratos
    .filter(c => c.faturamentoMes.status === 'pago')
    .reduce((sum, c) => sum + c.faturamentoMes.valor, 0)

  function formatMoney(n: number) {
    return `R$\u2009${n.toLocaleString('pt-BR')}`
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* ── HEADER ── */}
      <div className="bg-[#001845] px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="text-blue-200 text-2xl leading-none">‹</Link>
          <h1 className="text-lg font-medium text-white">Contratos</h1>
        </div>

        {/* ── RESUMO FATURAMENTO MÊS ── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-200 mb-0.5">Pago em mai</p>
            <p className="text-lg font-medium text-green-300">{formatMoney(totalPago)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-200 mb-0.5">A receber em mai</p>
            <p className={`text-lg font-medium ${totalReceber > 0 ? 'text-amber-300' : 'text-green-300'}`}>
              {formatMoney(totalReceber)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {contratos.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* ── CARD HEADER ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
              <div>
                <p className="text-[15px] font-medium text-gray-900">{c.cliente}</p>
                <p className="text-xs text-gray-400">{c.tipo} · desde {c.dataInicio}</p>
              </div>
              <StatusBadge variant={c.status} />
            </div>

            {/* ── DADOS ── */}
            <div className="px-4 py-3 space-y-2">
              <Row label="Valor base" value={formatMoney(c.valorBase)} />

              {c.valorAtual !== c.valorBase && (
                <Row
                  label="Valor atual"
                  value={formatMoney(c.valorAtual)}
                  valueClass="text-[#0353A4] font-medium"
                />
              )}

              {c.motivoAlteracao && (
                <Row label="Última alteração" value={`${c.ultimaAlteracao} — ${c.motivoAlteracao}`} small />
              )}

              <Row label="Visitas/mês" value={`${c.visitasMes} regulares`} />

              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-sm text-gray-500">Faturamento mai</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    c.faturamentoMes.status === 'pago' ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    {formatMoney(c.faturamentoMes.valor)}
                  </span>
                  <StatusBadge variant={c.faturamentoMes.status} />
                </div>
              </div>
            </div>

            {/* ── AÇÕES ── */}
            <div className="flex border-t border-gray-50">
              <button className="flex-1 py-3 text-sm text-gray-500 font-medium active:bg-gray-50 border-r border-gray-50">
                Histórico
              </button>
              <button className="flex-1 py-3 text-sm text-[#0466C8] font-medium active:bg-blue-50">
                Editar valor
              </button>
            </div>
          </div>
        ))}

        {/* ── TOGGLE INATIVOS ── */}
        <button
          onClick={() => setMostrarInativos(v => !v)}
          className="w-full py-3 text-sm text-gray-400 font-medium text-center active:text-gray-600"
        >
          {mostrarInativos ? 'Ocultar inativos' : 'Mostrar contratos inativos'}
        </button>
      </div>

      {/* ── FAB ── */}
      <button className="fixed bottom-6 right-4 bg-[#001845] text-white rounded-2xl px-5 py-4 text-[15px] font-medium shadow-lg active:scale-95 transition-transform z-20">
        + Novo contrato
      </button>
    </main>
  )
}

function Row({
  label,
  value,
  valueClass = 'text-gray-900',
  small = false,
}: {
  label: string
  value: string
  valueClass?: string
  small?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-gray-500 ${small ? 'text-xs' : 'text-sm'}`}>{label}</span>
      <span className={`font-medium ${small ? 'text-xs text-gray-600 text-right max-w-[55%]' : `text-sm ${valueClass}`}`}>
        {value}
      </span>
    </div>
  )
}