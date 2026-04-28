export const Pendencias = [
  {
    id: 'p1',
    titulo: 'Relatório ANVISA semestral',
    clienteId: 'Lar São Francisco',
    prazo: '12/05/2026',
    status: 'urgente' as const,
    diasAtraso: 2,
    descricao: 'Envio do relatório semestral de inspeção sanitária.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p2',
    titulo: 'Renovação contratual',
    clienteId: 'APAE São Luís',
    prazo: '29/04/2026',
    status: 'urgente' as const,
    descricao: 'Contrato vence em 2 dias. Aguardando assinatura da diretoria.',
    criadaEm: '2026-04-27T10:00:00Z'
  },
  {
    id: 'p3',
    titulo: 'Plano de ação — vigilância',
    clienteId: 'CAPS Centro',
    prazo: '18/05/2026',
    status: 'andamento' as const,
    descricao: 'Elaboração do plano de ação para visita da vigilância sanitária.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p4',
    titulo: 'Treinamento equipe',
    clienteId: 'Creche Girassol',
    prazo: '27/04/2026',
    status: 'atencao' as const,
    descricao: 'Agendamento do treinamento de boas práticas com a equipe.',
    criadaEm: '2026-04-24T10:00:00Z'
  },
  {
    id: 'p5',
    titulo: 'Alvará ANVISA',
    clienteId: 'Creche Girassol',
    prazo: '10/04/2026',
    status: 'resolvida' as const,
    descricao: 'Renovação do alvará sanitário concluída.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p6',
    titulo: 'Atualização PCMSO',
    clienteId: 'Home Care Vitória',
    prazo: '05/05/2026',
    status: 'atencao' as const,
    descricao: 'Revisão e atualização do programa de controle médico.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p7',
    titulo: 'Fatura Pendente',
    clienteId: 'Creche Girassol',
    prazo: '25/04/2026',
    status: 'atencao' as const,
    descricao: 'Fatura de Abril em aberto',
    criadaEm: '2026-04-24T10:00:00Z'
  },
]