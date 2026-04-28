export const Contratos = [
  {
    id: 1,
    cliente: 'Lar São Francisco',
    status: 'ativo',
    valorMensal: 3500,
    faturamentoMes: {
      status: 'pago',
      valor: 3500,
      vencimento: '2026-04-10',
    },
  },
  {
    id: 2,
    cliente: 'CAPS Centro',
    status: 'ativo',
    valorMensal: 2800,
    faturamentoMes: {
      status: 'pendente',
      valor: 2800,
      vencimento: '2026-04-30',
    },
  },
]