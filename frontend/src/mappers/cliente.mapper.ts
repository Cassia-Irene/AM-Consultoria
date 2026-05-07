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
  // 1. Tenta resolver o ID (alias híbrido)
  const idResolved = raw.id ?? raw.id_cliente
  
  // 2. Tenta resolver o Nome (alias híbrido)
  const nomeResolved = raw.nome_instituicao ?? raw.nome

  // Validação Estrita: Se não tiver ID ou Nome, o objeto é inválido
  if (!idResolved) {
    warnInvalidShape('Cliente:ID_MISSING', raw)
    throw new Error('[MAPPER][CLIENTE] Campo obrigatório ausente: id/id_cliente')
  }
  if (!nomeResolved) {
    warnInvalidShape('Cliente:NAME_MISSING', raw)
    throw new Error('[MAPPER][CLIENTE] Campo obrigatório ausente: nome/nome_instituicao')
  }

  // Validação de Forma para os demais campos (não-crítica)
  validateShape<ClienteRaw>('ClienteRaw', raw, [
    'tipo_instituicao',
    'cidade',
    'status'
  ])

  return {
    id: String(idResolved),
    nome_instituicao: nomeResolved,
    tipo_instituicao: raw.tipo_instituicao || 'Não informada',
    cidade: raw.cidade || 'Não informada',
    nivel_complexidade: raw.nivel_complexidade,
    observacoes_gerais: raw.observacoes_gerais,
    status: normalizeStatus(raw.status || 'ativo'),
  }
}