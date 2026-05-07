export const Pendencias = [
  {
    id: 'p1',
    titulo: 'Relatório ANVISA semestral',
    clienteId: '1',
    contratoId: '1',
    prazo: '12/05/2026',
    status: 'aberta' as const,
    prioridade: 'urgente' as const,
    diasAtraso: 2,
    descricao: 'Envio do relatório semestral de inspeção sanitária.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p2',
    titulo: 'Renovação contratual',
    clienteId: '2',
    contratoId: '2',
    prazo: '29/04/2026',
    status: 'aberta' as const,
    prioridade: 'urgente' as const,
    descricao: 'Contrato vence em 2 dias. Aguardando assinatura da diretoria.',
    criadaEm: '2026-04-27T10:00:00Z'
  },
  {
    id: 'p3',
    titulo: 'Plano de ação — vigilância',
    clienteId: '3',
    contratoId: '3',
    prazo: '18/05/2026',
    status: 'em_andamento' as const,
    prioridade: 'atencao' as const,
    descricao: 'Elaboração do plano de ação para visita da vigilância sanitária.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p4',
    titulo: 'Treinamento equipe',
    clienteId: '4',
    contratoId: '4',
    prazo: '27/04/2026',
    status: 'aberta' as const,
    prioridade: 'atencao' as const,
    descricao: 'Agendamento do treinamento de boas práticas com a equipe.',
    criadaEm: '2026-04-24T10:00:00Z'
  },
  {
    id: 'p5',
    titulo: 'Alvará ANVISA',
    clienteId: '4',
    contratoId: '4',
    prazo: '10/04/2026',
    status: 'concluida' as const,
    prioridade: 'normal' as const,
    descricao: 'Renovação do alvará sanitário concluída.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p6',
    titulo: 'Atualização PCMSO',
    clienteId: '5',
    contratoId: '5',
    prazo: '05/05/2026',
    status: 'aberta' as const,
    prioridade: 'atencao' as const,
    descricao: 'Revisão e atualização do programa de controle médico.',
    criadaEm: '2026-04-28T10:00:00Z'
  },
  {
    id: 'p7',
    titulo: 'Fatura Pendente',
    clienteId: '4',
    contratoId: '4',
    prazo: '25/04/2026',
    status: 'aberta' as const,
    prioridade: 'atencao' as const,
    descricao: 'Fatura de Abril em aberto',
    criadaEm: '2026-04-24T10:00:00Z'
  },
]