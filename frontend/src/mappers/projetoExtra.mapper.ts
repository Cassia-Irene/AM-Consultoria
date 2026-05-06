import { ProjetoExtras as Mock } from '@/lib/mocks'
import type { ProjetoExtra } from '@/domain/projetoExtra'
import type { ProjetoExtraRaw } from '@/types/projetoExtra.raw'
import { validateShape } from '@/utils/schemaGuard'

export function getProjetoExtras(): ProjetoExtra[] {
  return (Mock as ProjetoExtraRaw[]).map(mapExtra)
}

export function mapExtra(raw: ProjetoExtraRaw): ProjetoExtra {
  validateShape<ProjetoExtraRaw>('ProjetoExtraRaw', raw, [
    'id_extra',
    'id_projeto',
    'solicitado_por'
  ])

  return {
    id: String(raw.id_extra),
    projetoId: String(raw.id_projeto),

    solicitado_por: String(raw.solicitado_por),
    aprovado_por: raw.aprovado_por != null
      ? String(raw.aprovado_por)
      : undefined,
  }
}
