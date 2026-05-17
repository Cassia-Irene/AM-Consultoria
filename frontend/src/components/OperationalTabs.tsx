'use client'

import React from 'react'

export interface TabOption<T> {
  value: T
  label: string
  count?: number
}

interface OperationalTabsProps<T> {
  options: TabOption<T>[]
  currentValue: T
  onChange: (value: T) => void
}

/**
 * Componente de navegação por abas para listagens operacionais.
 * Mantém a consistência visual baseada no módulo de Pendências.
 */
export function OperationalTabs<T extends string>({ 
  options, 
  currentValue, 
  onChange 
}: OperationalTabsProps<T>) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
      {options.map(option => {
        const isActive = currentValue === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              shrink-0 px-4 py-2 rounded-xl text-xs md:text-[12px] font-bold transition-all border flex items-center gap-2
              ${isActive 
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-md' 
                : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300'
              }
            `}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`
                text-[10px] md:text-[11px] px-1.5 py-0.5 rounded-md font-bold
                ${isActive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800 text-zinc-400'}
              `}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
