// src/types/cliente.raw.ts
//
// Shape do JSON que a API retorna — espelha exatamente o ClienteRead (backend real)

export interface ClienteRaw {
  id_cliente: number
  nome: string
  tipo_instituicao: string
  cidade: string
  status: string
  nivel_complexidade: string | null
  observacoes_gerais: string | null
}