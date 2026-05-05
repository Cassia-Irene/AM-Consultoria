export const Contratos = [
  {
    id: 1,
    clienteId: '1',
    cliente: 'Lar São Francisco',
    status: 'ativo',
    tipo: 'Retentor',
    criadoEm: '2025-12-01',
    valorMensal: 3500,
    valor: 3500,
    valorBase: 3500,
    valorAtual: 3500,
    visitasMes: 3,
    faturamentoMes: {
      status: 'pago',
      valor: 3500,
      vencimento: '2026-04-10',
    },
    MudancaValor: {
      ultimaAlteracao: '2026-02-20',
      motivoAlteracao: 'Ajuste anual conforme contrato',
    }
  },
  {
    id: 2,
    clienteId: '3',
    cliente: 'CAPS Centro',
    status: 'ativo',
    tipo: 'Projeto Especial',
    criadoEm: '2026-01-15',
    valorMensal: 2800,
    valor: 2800,
    valorBase: 2800,
    valorAtual: 2800,
    visitasMes: 2,
    faturamentoMes: {
      status: 'pendente',
      valor: 2800,
      vencimento: '2026-04-30',
    },
    MudancaValor: {
      ultimaAlteracao: '2026-02-20',
      motivoAlteracao: 'Ajuste anual conforme contrato',
    }
  },
]