import React from 'react'
import { Check, AlertCircle, Clock, ShieldAlert, Activity, UserCheck } from 'lucide-react'

export type StatusVariant = 'urgente' | 'atencao' | 'andamento' | 'resolvida' | 'ativo' | 'inativo' | 'pago' | 'pendente'

interface BadgeConfig {
  bg: string
  text: string
  border: string
  label: string
  icon?: React.ElementType
}

const CONFIG: Record<StatusVariant, BadgeConfig> = {
  urgente:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',     label: 'urgente',      icon: ShieldAlert },
  atencao:   { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20',   label: 'atenção',      icon: AlertCircle },
  andamento: { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/20',     label: 'em andamento', icon: Activity    },
  resolvida: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'resolvida',    icon: Check       },
  ativo:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'ativo',        icon: UserCheck   },
  inativo:   { bg: 'bg-zinc-800/40',   text: 'text-zinc-500',   border: 'border-zinc-700/30',     label: 'inativo',      icon: Clock       },
  pago:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'pago',         icon: Check       },
  pendente:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20',   label: 'pendente',     icon: AlertCircle },
}

interface Props {
  variant: StatusVariant
  label?: string
  showIcon?: boolean
}

export function StatusBadge({ variant, label, showIcon = true }: Props) {
  const c = CONFIG[variant]
  const Icon = c.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${c.bg} ${c.text} ${c.border}`}>
      {showIcon && Icon && <Icon size={10} strokeWidth={3} />}
      {label ?? c.label}
    </span>
  )
}