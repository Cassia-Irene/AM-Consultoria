import { StatusBadge, StatusVariant } from './StatusBadge'
import type { Pendencia } from '@/domain/pendencia'
import { getPendenciaSeveridade, getPendenciaStatus, SeveridadePendencia } from '@/utils/pendencia'
import { getDiffDias, displayDate } from '@/utils/date'
import { truncateText } from '@/utils/text'


interface Props {
  pendencia: Pendencia
  clienteNome: string
  onResolve?: (id: string) => void
  onClick?: (id: string) => void
}

const BORDER_LEFT: Record<SeveridadePendencia, string> = {
  urgente: 'border-l-[3px] border-l-red-600',
  atencao: 'border-l-[3px] border-l-amber-500',
  normal: 'border-l-[3px] border-l-blue-500',
}

const OPACITY = {
  aberta: '',
  concluida: 'opacity-60',
  atrasada: '',
}

function prazoLabel(prazo?: string): { text: string; color: string } {
  if (!prazo) return { text: 'sem prazo', color: 'text-gray-400' }
  const diff = getDiffDias(prazo)
  
  if (diff < 0)
    return { text: `${Math.abs(diff)}d em atraso`, color: 'text-red-600 font-medium' }
  if (diff === 0) return { text: 'vence hoje', color: 'text-amber-600 font-medium' }
  if (diff === 1) return { text: 'vence amanhã', color: 'text-amber-500' }
  return { text: `prazo: ${displayDate(prazo)}`, color: 'text-gray-400' }

}

export function PendenciaCard({ pendencia, clienteNome, onResolve, onClick }: Props) {
  const severidade = getPendenciaSeveridade(pendencia)
  const status = getPendenciaStatus(pendencia)
  const { text: prazoText, color: prazoColor } = prazoLabel(pendencia.data_prazo)
  
  // StatusVariant espera certas strings específicas
  let statusVisual: StatusVariant = 'andamento'
  if (status === 'concluida') statusVisual = 'resolvida'
  if (severidade === 'urgente') statusVisual = 'urgente'
  if (severidade === 'atencao') statusVisual = 'atencao'

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-100 p-4
        ${BORDER_LEFT[severidade]}
        ${OPACITY[status]}
        ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}
      `}
      onClick={() => onClick?.(pendencia.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-gray-900 leading-snug" title={pendencia.descricao}>
            {truncateText(pendencia.descricao, 60)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{clienteNome}</p>
        </div>
        <StatusBadge variant={statusVisual} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className={`text-xs ${prazoColor}`}>{prazoText}</span>
        {status !== 'concluida' && onResolve && (
          <button
            onClick={(e) => { e.stopPropagation(); onResolve(pendencia.id) }}
            className="text-xs text-blue-600 font-medium py-1 px-3 rounded-lg bg-blue-50 active:bg-blue-100"
          >
            Resolver
          </button>
        )}
      </div>
    </div>
  )
}