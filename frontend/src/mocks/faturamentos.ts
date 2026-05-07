// src/mocks/faturamentos.ts
//
// Dados alinhados ao novo mapa lógico de faturamento_cliente.

export const Faturamentos = [
  {
    id_faturamento: 1,
    id_contrato: 1,
    mes_ano: '2026-05',
    visitas_realizadas: 3,
    valor_base: '3500.00',
    valor_extra: '0.00',
    desconto: '0.00',
    valor_total: '3500.00',
    pago: true,
    data_pagamento: '2026-05-08'
  },
  {
    id_faturamento: 2,
    id_contrato: 2,
    mes_ano: '2026-05',
    visitas_realizadas: 2,
    valor_base: '2800.00',
    valor_extra: '350.00',
    desconto: '0.00',
    valor_total: '3150.00',
    pago: false,
    data_pagamento: null
  }
]
