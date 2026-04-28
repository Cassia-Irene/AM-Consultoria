export type StatusVariant = 'urgente' | 'atencao' | 'andamento' | 'resolvida' | 'ativo' | 'inativo' | 'pago' | 'pendente'

const CONFIG: Record<StatusVariant, { bg: string; text: string; label: string }> = {
  urgente:   { bg: 'bg-red-100',    text: 'text-red-800',    label: 'urgente'      },
  atencao:   { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'atenção'      },
  andamento: { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'em andamento' },
  resolvida: { bg: 'bg-green-100',  text: 'text-green-800',  label: 'resolvida'    },
  ativo:     { bg: 'bg-green-100',  text: 'text-green-800',  label: 'ativo'        },
  inativo:   { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'inativo'      },
  pago:      { bg: 'bg-green-100',  text: 'text-green-800',  label: 'pago'         },
  pendente:  { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'pendente'     },
}

interface Props {
  variant: StatusVariant
  label?: string
}

export function StatusBadge({ variant, label }: Props) {
  const c = CONFIG[variant]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {label ?? c.label}
    </span>
  )
}