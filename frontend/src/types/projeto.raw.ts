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

  valor_total: string | number
  status: string
  atrasado?: boolean
  observacoes_gerais: string | null

  // Inteligência (Back-First)
  score_tensao?: number
  nivel_tensao?: string
  count_atrasos?: number
}
