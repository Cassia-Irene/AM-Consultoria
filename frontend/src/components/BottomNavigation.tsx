'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNavigation() {
  const pathname = usePathname()

  // Não exibe a navegação inferior em telas de formulário/criação para evitar poluição
  const isFormPage = pathname.includes('/nova') || pathname.includes('/rapida')
  if (isFormPage) return null

  const items = [
    { 
      href: '/dashboard', 
      label: 'Início',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      )
    },
    { 
      href: '/clientes', 
      label: 'Clientes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    { 
      href: '/visitas/rapida', 
      label: 'Registrar',
      isAction: true,
      icon: (
        <span className="text-xl">⚡</span>
      )
    },
    { 
      href: '/pendencias', 
      label: 'Pendências',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    { 
      href: '/dashboard/financeiro', 
      label: 'Financeiro',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 border-t border-zinc-800/50 backdrop-blur-lg pb-safe">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.href
          
          if (item.isAction) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center -mt-8">
                <div className="size-14 rounded-2xl bg-[#0466C8] shadow-lg shadow-blue-900/40 flex items-center justify-center text-white active:scale-95 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0466C8] mt-2">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? 'text-white' : 'text-zinc-600'
              }`}
            >
              <div className={isActive ? 'text-sky-500' : ''}>
                {item.icon}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-sky-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
