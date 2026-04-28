// src/domain/insight.ts

/** Tipo de ação que o usuário pode executar diretamente no dashboard */
export type AcaoRapida = 'resolver' | 'reagendar' | 'ver_contexto'

/** O item mais importante do sistema neste momento */
export type InsightPrioridade = {
  tipo: 'top1'
  titulo: string
  descricao: string
  clienteNome: string
  entidadeId: string
  href: string        // onde ir ao clicar
  prazoLabel: string  // ex: "ontem", "hoje", "amanhã", "2d atrás"
  atraso: boolean     // true se já venceu
}
