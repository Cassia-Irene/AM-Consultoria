// src/mocks/faturamentos.ts
//
// Dados temporários de faturamento mensal por contrato.
// Simula o que virá de GET /faturamento-cliente?mes=YYYY-MM
// Shape = FaturamentoCliente (src/domain/faturamento.ts)

export const Faturamentos = [
  {
    id_faturamento: 'fat-1',
    id_cliente: 1,
    id_contrato: 1,
    mes_referencia: '2026-05',
    valor_base: 3500,
    valor_visitas_extra: 0,
    valor_total: 3500,
    status: 'pago',
    data_vencimento: '2026-05-10',
    data_pagamento: '2026-05-08',
  },
  {
    id_faturamento: 'fat-2',
    id_cliente: 3,
    id_contrato: 2,
    mes_referencia: '2026-05',
    valor_base: 2800,
    valor_visitas_extra: 350,
    valor_total: 3150,
    status: 'pendente',
    data_vencimento: '2026-05-30',
    data_pagamento: null,
  },
]
