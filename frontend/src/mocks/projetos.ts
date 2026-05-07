// src/mocks/projetos.ts

export const Projetos = [
  {
    id_projeto: 1,
    id_contrato: 1,
    titulo: 'Implantação de prontuário digital',
    descricao: 'Projeto completo de digitalização dos registros clínicos',
    data_inicio: '2026-02-01',
    data_fim_prevista: '2026-04-01',
    data_fim_real: null,
    valor_total: '8000',
    status: 'em_andamento',
    observacoes_gerais: null
  },
  {
    id_projeto: 2,
    id_contrato: 2,
    titulo: 'Auditoria interna de processos',
    descricao: null,
    data_inicio: '2026-01-10',
    data_fim_prevista: '2026-02-10',
    data_fim_real: '2026-02-05',
    valor_total: '3000',
    status: 'concluido',
    observacoes_gerais: 'Finalizado antes do prazo'
  },
  {
    id_projeto: 3,
    id_contrato: 1,
    titulo: 'Treinamento da equipe de enfermagem',
    descricao: 'Capacitação em protocolos de segurança do paciente',
    data_inicio: '2026-05-01',
    data_fim_prevista: '2026-06-01',
    data_fim_real: null,
    valor_total: '4500',
    status: 'planejado',
    observacoes_gerais: null
  }
]
