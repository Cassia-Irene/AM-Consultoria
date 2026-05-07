import { Contatos as Mock } from '@/lib/mocks'
import type { Contato } from '@/domain/contato'
import type { ContatoRaw } from '@/types/contato.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getContatos(): Contato[] {
  return (Mock as ContatoRaw[]).map(mapContato)
}

export function mapContato(raw: ContatoRaw): Contato {
  validateShape<ContatoRaw>('ContatoRaw', raw, [
    'id_contato',
    'id_cliente',
    'nome',
    'papel'
  ])

  if (!raw.nome) {
    throw new Error(`ContatoRaw (ID: ${raw.id_contato}) missing nome`)
  }

  if (!raw.papel) {
    throw new Error(`ContatoRaw (ID: ${raw.id_contato}) missing papel`)
  }

  return {
    id: String(raw.id_contato),
    clienteId: String(raw.id_cliente),

    nome: raw.nome,
    cargo: raw.cargo ?? undefined,
    papel: raw.papel,

    telefone_whatsapp: raw.telefone_whatsapp ?? undefined,
    email: raw.email ?? undefined,
    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}
