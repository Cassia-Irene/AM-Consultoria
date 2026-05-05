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
  const nome_instituicao = raw.nome_instituicao || raw.nome
  if (!nome_instituicao) throw new Error(`ClienteRaw (ID: ${raw.id}) missing required field: nome_instituicao`)

  return {
    id: String(raw.id),
    nome_instituicao,
    tipo_instituicao: raw.tipo || 'Padrão',
    cidade: raw.cidade || 'Não informada',
    nivel_complexidade: raw.nivel_complexidade,
    modalidade_atendimento: raw.modalidade_atendimento,
    observacoes_gerais: raw.observacoes_gerais,
    status: normalizeStatus(raw.status),
  }
}