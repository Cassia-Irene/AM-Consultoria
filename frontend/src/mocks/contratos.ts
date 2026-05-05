// src/mocks/contratos.ts
//
// Mock alinhado ao novo mapa lógico real.

export const Contratos = [
  {
    id_contrato: 1,
    id_cliente: 1,
    servicos_contratados: 'Consultoria mensal + visitas técnicas',
    visitas_previstas_mes: 3,
    inclui_relatorio: true,
    data_inicio: '2025-12-01',
    data_fim: null,
    observacoes_gerais: 'Contrato padrão anual'
  },
  {
    id_contrato: 2,
    id_cliente: 3,
    servicos_contratados: 'Projeto de adequação sanitária',
    visitas_previstas_mes: 2,
    inclui_relatorio: false,
    data_inicio: '2026-01-15',
    data_fim: null,
    observacoes_gerais: null
  }
]