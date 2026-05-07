// src/types/projeto.raw.ts
//
// Shape do JSON da API — espelha exatamente ProjetoRead (backend).

export interface ProjetoRaw {
  id_projeto: number
  id_contrato: number

  titulo: string
  descricao: string | null

  data_inicio: string
  data_fim_prevista: string | null
  data_fim_real: string | null

  valor_total: string  // Decimal vem como string no JSON

  status: string

  observacoes_gerais: string | null
}
