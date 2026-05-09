import { Clientes as ClientesMock } from '@/mocks/clientes'
import type { Cliente } from '@/domain/cliente'
import type { ClienteRaw } from '@/types/cliente.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

function normalizeStatus(status: string): 'ativo' | 'inativo' {
  const s = String(status || '').toLowerCase()
  if (s === 'ativo') return 'ativo'
  if (s === 'inativo') return 'inativo'

  console.warn('[MAPPER][CLIENTE] Status desconhecido:', status)
  return 'inativo'
}

export function getClientes(): Cliente[] {
  return (ClientesMock as unknown as ClienteRaw[]).map(mapCliente)
}

export function mapCliente(raw: ClienteRaw): Cliente {
  // Validação Estrita conforme ClienteRead (Backend)
  if (!raw.id_cliente) {
    warnInvalidShape('Cliente:ID_MISSING', raw)
    throw new Error('[MAPPER][CLIENTE] Campo obrigatório ausente: id_cliente')
  }
  if (!raw.nome) {
    warnInvalidShape('Cliente:NAME_MISSING', raw)
    throw new Error('[MAPPER][CLIENTE] Campo obrigatório ausente: nome')
  }

  validateShape<ClienteRaw>('ClienteRead', raw, [
    'id_cliente',
    'nome',
    'tipo_instituicao',
    'cidade',
    'status'
  ])

  return {
    id: String(raw.id_cliente),
    nome_instituicao: raw.nome,
    tipo_instituicao: raw.tipo_instituicao || 'Não informada',
    cidade: raw.cidade || 'Não informada',
    nivel_complexidade: raw.nivel_complexidade ?? undefined,
    observacoes_gerais: raw.observacoes_gerais ?? undefined,
    status: normalizeStatus(raw.status || 'ativo'),
  }
}