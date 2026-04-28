// components/MetricCard.tsx
export type MetricVariant = 'default' | 'urgent' | 'warn' | 'ok'

interface Props {
  label: string
  value: string | number
  sub?: string
  variant?: MetricVariant
  onClick?: () => void
}

const BORDER: Record<MetricVariant, string> = {
  default: '',
  urgent:  'border-l-4 border-l-red-600',
  warn:    'border-l-4 border-l-amber-500',
  ok:      'border-l-4 border-l-green-600',
}

const VALUE_COLOR: Record<MetricVariant, string> = {
  default: 'text-gray-900',
  urgent:  'text-red-600',
  warn:    'text-amber-600',
  ok:      'text-green-700',
}

export function MetricCard({ label, value, sub, variant = 'default', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-50 rounded-xl p-4
        ${BORDER[variant]}
        ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}
      `}
    >
      <p className="text-sm text-gray-500 mb-1 leading-tight">{label}</p>
      <p className={`text-3xl font-medium leading-none ${VALUE_COLOR[variant]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
}