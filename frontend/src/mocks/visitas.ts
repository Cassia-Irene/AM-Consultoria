export const Visitas = [
  {
    id_visita: 1,
    id_contrato: 1,
    id_projeto: null,

    status: 'realizada',

    data_hora: '2026-04-28T09:00:00',

    duracao_minutos: 90,

    tipo_visita: 'rotina',
    modalidade: 'presencial',

    descricao: 'Acompanhamento mensal.',

    resultados: 'Paciente estável.'
  },
  {
    id_visita: 2,
    id_contrato: 2,
    id_projeto: 1,

    status: 'agendada',

    data_hora: '2026-05-10T14:00:00',

    duracao_minutos: null,

    tipo_visita: 'projeto',
    modalidade: 'online',

    descricao: 'Reunião de alinhamento do projeto.',

    resultados: null
  }
]