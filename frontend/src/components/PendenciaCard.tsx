import { StatusBadge, StatusVariant } from './StatusBadge'

export interface Pendencia {
  id: string
  titulo: string
  cliente: string
  prazo: string
  status: 'urgente' | 'atencao' | 'andamento' | 'resolvida'
  diasAtraso?: number
  descricao?: string
}

interface Props {
  pendencia: Pendencia
  onResolve?: (id: string) => void
  onClick?: (id: string) => void
}

const BORDER_LEFT: Record<Pendencia['status'], string> = {
  urgente:   'border-l-[3px] border-l-red-600',
  atencao:   'border-l-[3px] border-l-amber-500',
  andamento: 'border-l-[3px] border-l-blue-500',
  resolvida: 'border-l-[3px] border-l-green-600',
}

const OPACITY: Record<Pendencia['status'], string> = {
  urgente:   '',
  atencao:   '',
  andamento: '',
  resolvida: 'opacity-60',
}

function prazoLabel(prazo: string, diasAtraso?: number): { text: string; color: string } {
  if (diasAtraso && diasAtraso > 0)
    return { text: `${diasAtraso}d em atraso`, color: 'text-red-600 font-medium' }
  if (prazo === 'hoje') return { text: 'vence hoje', color: 'text-amber-600 font-medium' }
  if (prazo === 'amanha') return { text: 'vence amanhã', color: 'text-amber-500' }
  return { text: `prazo: ${prazo}`, color: 'text-gray-400' }
}

export function PendenciaCard({ pendencia, onResolve, onClick }: Props) {
  const { text: prazoText, color: prazoColor } = prazoLabel(pendencia.prazo, pendencia.diasAtraso)

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-100 p-4
        ${BORDER_LEFT[pendencia.status]}
        ${OPACITY[pendencia.status]}
        ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}
      `}
      onClick={() => onClick?.(pendencia.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-gray-900 leading-snug">{pendencia.titulo}</p>
          <p className="text-sm text-gray-500 mt-0.5">{pendencia.cliente}</p>
        </div>
        <StatusBadge variant={pendencia.status as StatusVariant} />
      </div>

      {pendencia.descricao && (
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{pendencia.descricao}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className={`text-xs ${prazoColor}`}>{prazoText}</span>
        {pendencia.status !== 'resolvida' && onResolve && (
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