export const Visitas = [
  {
    id_visita: 1,
    id_cliente: 1,
    id_contrato: 1,
    id_projeto: null,
    status: 'realizada',
    data_hora: '2026-05-06T22:30:00', // Noturna
    duracao_minutos: 30,
    tipo_visita: 'urgente',

    modalidade: 'presencial',
    descricao: 'Emergência Noturna - Escala Cuidadores',
    resultados: 'Resolvido via remanejamento.'
  },
  {
    id_visita: 2,
    id_cliente: 1,
    id_contrato: 1,
    id_projeto: null,
    status: 'realizada',
    data_hora: '2026-05-04T15:30:00',
    duracao_minutos: 45,
    tipo_visita: 'urgente',

    modalidade: 'online',
    descricao: 'Ajuste rápido fluxo medicação',
    resultados: 'Orientação enviada.'
  },
  {
    id_visita: 3,
    id_cliente: 1,
    id_contrato: 1,
    id_projeto: null,
    status: 'realizada',
    data_hora: '2026-05-03T10:00:00', // Domingo
    duracao_minutos: 40,
    tipo_visita: 'urgente',

    modalidade: 'presencial',
    descricao: 'Suporte operação - Domingo',
    resultados: 'Visita extra não prevista.'
  },
  {
    id_visita: 4,
    id_cliente: 1,
    id_contrato: 1,
    id_projeto: null,
    status: 'agendada',
    data_hora: '2026-05-07T14:00:00',
    duracao_minutos: 60,
    tipo_visita: 'rotineira',
    modalidade: 'presencial',
    descricao: 'Visita de Rotina Semana 2',
    resultados: null
  },
  {
    id_visita: 5,
    id_cliente: 2,
    id_contrato: 2,
    id_projeto: 1,
    status: 'realizada',
    data_hora: '2026-04-27T08:00:00',
    duracao_minutos: 540,
    tipo_visita: 'estruturada',
    modalidade: 'presencial',
    descricao: 'Imersão Bacabal - Auditoria Interna',
    resultados: 'Mapeamento completo realizado.'
  },
  {
    id_visita: 6,
    id_cliente: 3,
    id_contrato: 3,
    id_projeto: null,
    status: 'realizada',
    data_hora: '2026-05-05T10:00:00',
    duracao_minutos: 150,
    tipo_visita: 'rotineira',
    modalidade: 'presencial',
    descricao: 'Reunião Gestão - Alinhamento ANVISA',
    resultados: 'Necessita correção imediata de prontuários.'
  },
  {
    id_visita: 7,
    id_cliente: 4,
    id_contrato: 4,
    id_projeto: null,
    status: 'realizada',
    data_hora: '2026-05-02T14:00:00',
    duracao_minutos: 120,
    tipo_visita: 'urgente',

    modalidade: 'presencial',
    descricao: 'Apoio Familiar - Caso Delicado',
    resultados: 'Mediação de conflito entre lar e família.'
  },
  {
    id_visita: 8,
    id_cliente: 4,
    id_contrato: 4,
    id_projeto: null,
    status: 'realizada',
    data_hora: '2026-04-25T09:00:00',
    duracao_minutos: 90,
    tipo_visita: 'urgente',

    modalidade: 'presencial',
    descricao: 'Visita Extra - Suporte Administrativo',
    resultados: 'Ajuste de fluxos internos.'
  }
]