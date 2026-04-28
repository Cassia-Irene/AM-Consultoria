export const Clientes = [
  { id: '1', nome: 'Lar São Francisco',  tipo: 'ILPI',     status: 'ativo' as const, pendenciasUrgentes: 2, proximaVisita: 'hoje'   },
  { id: '2', nome: 'APAE São Luís',      tipo: 'APAE',     status: 'ativo' as const, pendenciasUrgentes: 1, proximaVisita: 'amanha' },
  { id: '3', nome: 'CAPS Centro',        tipo: 'CAPS',     status: 'ativo' as const, pendenciasUrgentes: 0, proximaVisita: '30/05'  },
  { id: '4', nome: 'Creche Girassol',    tipo: 'Creche',   status: 'ativo' as const, pendenciasUrgentes: 0, proximaVisita: '02/06'  },
  { id: '5', nome: 'Home Care Vitória',  tipo: 'Home Care',status: 'ativo' as const, pendenciasUrgentes: 0, proximaVisita: '05/06'  },
  { id: '6', nome: 'Lar Esperança',      tipo: 'ILPI',     status: 'inativo' as const,pendenciasUrgentes: 0, proximaVisita: null    },
]