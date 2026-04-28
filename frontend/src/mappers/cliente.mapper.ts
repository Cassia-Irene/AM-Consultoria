import { Clientes as ClientesMock } from '@/lib/mocks'
import type { Cliente } from '@/domain/cliente'
import type { ClienteRaw } from '@/types/cliente.raw'

function normalizeStatus(status: string): 'ativo' | 'inativo' {
  if (status === 'ativo') return 'ativo'
  if (status === 'inativo') return 'inativo'

  console.warn('Status desconhecido:', status)
  return 'inativo'
}

export function getClientes(): Cliente[] {
  return (ClientesMock as ClienteRaw[]).map(mapCliente)
}

export function mapCliente(raw: ClienteRaw): Cliente {
  return {
    id: String(raw.id),
    nome: raw.nome,
    tipo: raw.tipo,
    status: normalizeStatus(raw.status),
  }
}