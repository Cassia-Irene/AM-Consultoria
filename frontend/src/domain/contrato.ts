// src/domain/contrato.ts
//
// Reflete 100% o modelo SQLAlchemy `Contrato` (backend/src/models/contrato.py)
// Campos removidos: faturamento (campo fantasma), criadoEm (não existe na tabela)
// snake_case alinhado ao backend — sem convenção própria do frontend

export type StatusContrato = 'ativo' | 'inativo' | 'suspenso'

export type Contrato = {
  id: string                       // id_contrato (PK) — string no front, int no banco
  clienteId: string                // id_cliente (FK) — mantido camelCase por convenção de FK no front

  tipo_cobranca: string            // "Retentor" | "Projeto Especial" | etc.
  valor_mensal: number             // Numeric(10,2) no banco
  visitas_previstas_mes: number    // Integer no banco
  valor_visita_extra?: number      // Nullable no banco

  inclui_relatorio: boolean        // Boolean com default False no banco

  data_inicio: string              // Date ISO 8601: YYYY-MM-DD
  data_fim?: string                // Nullable — null = contrato indeterminado

  status: StatusContrato

  motivo_alteracao?: string        // Text nullable — último motivo de alteração
  observacoes?: string             // Text nullable
}