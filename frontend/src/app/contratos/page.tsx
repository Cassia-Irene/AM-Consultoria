'use client'
// app/contratos/page.tsx

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StatusBadge, type StatusVariant } from '../../components/StatusBadge'
import { getContratos } from '@/mappers/contrato.mapper'
import { getClientes } from '@/mappers/cliente.mapper'
import { getFaturamentos } from '@/mappers/faturamento.mapper'
import { getFaturamentoMaisRecente } from '@/domain/faturamento'
import type { Contrato } from '@/domain/contrato'
import type { FaturamentoCliente } from '@/domain/faturamento'

type ContratoComCliente = Contrato & { clienteNome: string }

export default function ContratosPage() {
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [contratos, setContratos] = useState<ContratoComCliente[]>([])
  const [faturamentos, setFaturamentos] = useState<FaturamentoCliente[]>([])

  useEffect(() => {
    const todosContratos = getContratos()
    const clientes = getClientes()
    const clienteNomePorId = new Map(clientes.map(c => [c.id, c.nome_instituicao]))

    const comNome: ContratoComCliente[] = todosContratos.map(c => ({
      ...c,
      clienteNome: clienteNomePorId.get(c.clienteId) ?? `Cliente ${c.clienteId}`,
    }))

    setContratos(comNome)
    setFaturamentos(getFaturamentos())
  }, [])

  const listaFiltrada = mostrarInativos
    ? contratos
    : contratos.filter(c => c.status === 'ativo')

  // Totais calculados sobre faturamento real — não sobre contrato
  const totalReceber = listaFiltrada.reduce((sum, c) => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    return fat?.status === 'pendente' ? sum + fat.valor_total : sum
  }, 0)

  const totalPago = listaFiltrada.reduce((sum, c) => {
    const fat = getFaturamentoMaisRecente(faturamentos, c.id)
    return fat?.status === 'pago' ? sum + fat.valor_total : sum
  }, 0)

  function formatMoney(n: number) {
    return `R$\u2009${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  // Mês de referência atual (para exibição)
  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'short' })

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
            <p className="text-xs text-blue-200 mb-0.5">Pago em {mesAtual}</p>
            <p className="text-lg font-medium text-green-300">{formatMoney(totalPago)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-blue-200 mb-0.5">A receber em {mesAtual}</p>
            <p className={`text-lg font-medium ${totalReceber > 0 ? 'text-amber-300' : 'text-green-300'}`}>
              {formatMoney(totalReceber)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {listaFiltrada.map(c => {
          const fat = getFaturamentoMaisRecente(faturamentos, c.id)
          return (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {/* ── CARD HEADER ── */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
                <div>
                  <p className="text-[15px] font-medium text-gray-900">{c.clienteNome}</p>
                  <p className="text-xs text-gray-400">
                    {c.tipo_cobranca} · desde {c.data_inicio}
                  </p>
                </div>
                <StatusBadge variant={c.status as StatusVariant} />
              </div>

              {/* ── DADOS ── */}
              <div className="px-4 py-3 space-y-2">
                <Row label="Valor mensal" value={formatMoney(c.valor_mensal)} />
                <Row label="Visitas/mês" value={`${c.visitas_previstas_mes} regulares`} />

                {c.valor_visita_extra != null && (
                  <Row label="Visita extra" value={formatMoney(c.valor_visita_extra)} />
                )}

                {c.inclui_relatorio && (
                  <Row label="Relatório" value="Incluso" />
                )}

                {c.motivo_alteracao && (
                  <Row
                    label="Última alteração"
                    value={c.motivo_alteracao}
                    small
                  />
                )}

                {/* ── FATURAMENTO DO MÊS ── */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-sm text-gray-500">Faturamento {mesAtual}</span>
                  {fat ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        fat.status === 'pago' ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {formatMoney(fat.valor_total)}
                      </span>
                      <StatusBadge variant={fat.status as StatusVariant} />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sem registro</span>
                  )}
                </div>
              </div>

              {/* ── AÇÕES ── */}
              <div className="flex border-t border-gray-50">
                <Link
                  href={`/contratos/${c.id}`}
                  className="flex-1 py-3 text-sm text-gray-500 font-medium text-center active:bg-gray-50 border-r border-gray-50"
                >
                  Ver detalhe
                </Link>
                <button className="flex-1 py-3 text-sm text-[#0466C8] font-medium active:bg-blue-50">
                  Editar valor
                </button>
              </div>
            </div>
          )
        })}

        {/* ── TOGGLE INATIVOS ── */}
        <button
          onClick={() => setMostrarInativos(v => !v)}
          className="w-full py-3 text-sm text-gray-400 font-medium text-center active:text-gray-600"
        >
          {mostrarInativos ? 'Ocultar inativos' : 'Mostrar contratos inativos'}
        </button>
      </div>
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