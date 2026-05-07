import { Pendencia } from '@/domain/pendencia'
import { toAPIDate } from '@/utils/date'

export function toPendenciaPayload(pendencia: Pendencia) {
  const isResolvida = pendencia.status === 'concluida'

  return {
    id_contrato: Number(pendencia.contratoId),
    id_visita: pendencia.visitaId ? Number(pendencia.visitaId) : null,
    descricao: pendencia.descricao || pendencia.titulo,
    responsavel: 'Sistema',
    data_origem: toAPIDate(pendencia.criadaEm) || new Date().toISOString().split('T')[0],
    data_prazo: pendencia.prazo ? toAPIDate(pendencia.prazo) : null,
    resolvida: isResolvida,
    data_resolucao: isResolvida && pendencia.data_resolucao ? toAPIDate(pendencia.data_resolucao) : null,
    prioridade: pendencia.prioridade
  }
}
