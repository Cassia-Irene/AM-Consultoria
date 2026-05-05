export interface ClienteRaw {
  id: number | string
  nome?: string // Mapeado para nome_instituicao no front, mas o mock ainda usava 'nome'
  nome_instituicao?: string
  tipo?: string
  status: string
  cidade?: string
  nivel_complexidade?: string
  modalidade_atendimento?: string
  observacoes_gerais?: string
}