// src/domain/projeto.ts
//
// Reflete a entidade PROJETOS do banco.
// Entregas não-recorrentes vinculadas a um contrato.

export type StatusProjeto =
  | 'em andamento'
  | 'concluído'
  | 'cancelado'

export type Projeto = {
  id: string
  contratoId: string

  titulo: string
  descricao?: string

  data_inicio: string              // ISO 8601
  data_fim_prevista?: string       // nullable
  data_fim_real?: string           // nullable — preenchido ao concluir

  valor_total: number

  status: StatusProjeto
  atrasado?: boolean
  isExtra?: boolean

  observacoes_gerais?: string
}
