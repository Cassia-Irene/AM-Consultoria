export interface ClienteRaw {
  id?: number | string
  id_cliente?: number | string
  nome?: string
  nome_instituicao?: string
  tipo_instituicao: string
  cidade: string
  status: string
  nivel_complexidade?: string
  observacoes_gerais?: string
}