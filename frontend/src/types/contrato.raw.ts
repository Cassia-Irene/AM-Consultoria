// src/types/contrato.raw.ts
//
// Shape do JSON que a API retorna — espelha exatamente o ContratoRead (backend/src/schemas/contrato.py)
// Sem campos extras, sem campos opcionais que não existem no banco.

export interface ContratoRaw {
  id_contrato: number
  id_cliente: number

  tipo_cobranca: string
  valor_mensal: string        // Decimal vem como string do FastAPI/JSON
  visitas_previstas_mes: number
  valor_visita_extra: string | null

  inclui_relatorio: boolean

  data_inicio: string         // ISO 8601: "YYYY-MM-DD"
  data_fim: string | null

  status: string
  motivo_alteracao: string | null
  observacoes: string | null
}