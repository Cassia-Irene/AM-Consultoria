import { Contatos as Mock } from '@/lib/mocks'
import type { Contato } from '@/domain/contato'
import type { ContatoRaw } from '@/types/contato.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getContatos(): Contato[] {
  return (Mock as ContatoRaw[]).map(mapContato)
}

export function mapContato(raw: ContatoRaw): Contato {
  const idResolved = raw.id_contato ?? raw.id
  const clienteIdResolved = raw.id_cliente ?? raw.clienteId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Contato:ID_MISSING', raw)
    throw new Error('[MAPPER][CONTATO] Campo obrigatório ausente: id_contato/id')
  }
  if (!clienteIdResolved) {
    warnInvalidShape('Contato:CLIENTE_ID_MISSING', raw)
    throw new Error('[MAPPER][CONTATO] Campo obrigatório ausente: id_cliente/clienteId')
  }

  // Validação Importante (não-crítica)
  if (!raw.nome) {
    warnInvalidShape('Contato:NOME_MISSING', raw, 'Usando fallback: "Nome não informado"')
  }
  if (!raw.papel) {
    warnInvalidShape('Contato:PAPEL_MISSING', raw, 'Usando fallback: "Contato"')
  }

  validateShape<ContatoRaw>('ContatoRaw', raw, [
    'cargo'
  ])

  return {
    id: String(idResolved),
    clienteId: String(clienteIdResolved),

    nome: raw.nome || 'Nome não informado',
    cargo: raw.cargo ?? undefined,
    papel: raw.papel || 'Contato',

    telefone_whatsapp: raw.telefone ?? raw.telefone_whatsapp ?? undefined,
    email: raw.email ?? undefined,
    observacoes_gerais: raw.observacoes_gerais ?? undefined,
  }
}
