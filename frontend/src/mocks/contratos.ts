// src/mocks/contratos.ts
//
// Shape = exatamente o que a API retornará (modelo SQLAlchemy Contrato).
// Sem adaptação no mapper — dados aqui já devem estar corretos.
// Campos alinhados a: backend/src/models/contrato.py

export const Contratos = [
  {
    id_contrato: 1,
    id_cliente: 1,               // FK para cliente — int como vem da API
    tipo_cobranca: 'Retentor',
    valor_mensal: 3500,
    visitas_previstas_mes: 3,
    valor_visita_extra: null,
    inclui_relatorio: false,
    data_inicio: '2025-12-01',
    data_fim: null,
    status: 'ativo',
    motivo_alteracao: 'Ajuste anual conforme contrato',
    observacoes: null,
  },
  {
    id_contrato: 2,
    id_cliente: 3,               // FK para cliente id=3
    tipo_cobranca: 'Projeto Especial',
    valor_mensal: 2800,
    visitas_previstas_mes: 2,
    valor_visita_extra: 350,
    inclui_relatorio: true,
    data_inicio: '2026-01-15',
    data_fim: null,
    status: 'ativo',
    motivo_alteracao: null,
    observacoes: null,
  },
]