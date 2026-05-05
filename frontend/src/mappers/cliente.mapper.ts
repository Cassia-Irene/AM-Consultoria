import { Clientes as ClientesMock } from '@/mocks/clientes'
import type { Cliente } from '@/domain/cliente'
import type { ClienteRaw } from '@/types/cliente.raw'
import { validateShape } from '@/utils/schemaGuard'

function normalizeStatus(status: string): 'ativo' | 'inativo' {
  if (status === 'ativo') return 'ativo'
  if (status === 'inativo') return 'inativo'

  console.warn('Status desconhecido:', status)
  return 'inativo'
}

export function getClientes(): Cliente[] {
  return (ClientesMock as unknown as ClienteRaw[]).map(mapCliente)
}

export function mapCliente(raw: ClienteRaw): Cliente {
  validateShape<ClienteRaw>('ClienteRaw', raw, [
    'id',
    'nome_instituicao',
    'tipo_instituicao',
    'cidade',
    'status'
  ])

  if (!raw.nome_instituicao) throw new Error(`ClienteRaw (ID: ${raw.id}) missing required field: nome_instituicao`)
  if (!raw.tipo_instituicao) throw new Error(`ClienteRaw (ID: ${raw.id}) missing required field: tipo_instituicao`)
  if (!raw.cidade) throw new Error(`ClienteRaw (ID: ${raw.id}) missing required field: cidade`)

  return {
    id: String(raw.id),
    nome_instituicao: raw.nome_instituicao,
    tipo_instituicao: raw.tipo_instituicao,
    cidade: raw.cidade,
    nivel_complexidade: raw.nivel_complexidade,
    observacoes_gerais: raw.observacoes_gerais,
    status: normalizeStatus(raw.status),
  }
}