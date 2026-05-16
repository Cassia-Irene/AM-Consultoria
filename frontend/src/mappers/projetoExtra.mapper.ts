import { ProjetoExtras as Mock } from '@/lib/mocks'
import type { ProjetoExtra } from '@/domain/projetoExtra'
import type { ProjetoExtraRaw } from '@/types/projetoExtra.raw'
import { validateShape, warnInvalidShape } from '@/utils/schemaGuard'

export function getProjetoExtras(): ProjetoExtra[] {
  return (Mock as unknown as ProjetoExtraRaw[]).map(mapExtra)
}

export function mapExtra(raw: ProjetoExtraRaw): ProjetoExtra {
  const idResolved = raw.id_extra ?? raw.id
  const projetoIdResolved = raw.id_projeto ?? raw.projetoId

  // Validação Estrita
  if (!idResolved) {
    warnInvalidShape('Extra:ID_MISSING', raw)
    throw new Error('[MAPPER][EXTRA] Campo obrigatório ausente: id_extra/id')
  }
  if (!projetoIdResolved) {
    warnInvalidShape('Extra:PROJETO_ID_MISSING', raw)
    throw new Error('[MAPPER][EXTRA] Campo obrigatório ausente: id_projeto/projetoId')
  }

  validateShape<ProjetoExtraRaw>('ProjetoExtraRaw', raw, [
    'solicitado_por'
  ])

  return {
    id: String(idResolved),
    projetoId: String(projetoIdResolved),

    solicitado_por: String(raw.solicitado_por || 'Não informado'),
    aprovado_por: raw.aprovado_por != null
      ? String(raw.aprovado_por)
      : undefined,
    solicitado_por_nome: raw.solicitado_por_nome,
    aprovado_por_nome: raw.aprovado_por_nome,
  }
}
