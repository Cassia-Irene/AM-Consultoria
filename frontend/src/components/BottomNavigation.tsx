'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Zap, CheckSquare, Wallet } from 'lucide-react'

export function BottomNavigation() {
  const pathname = usePathname()

  // Não exibe a navegação inferior em telas de formulário/criação para evitar poluição
  const isFormPage = pathname.includes('/nova') || pathname.includes('/rapida')
  if (isFormPage) return null

  const items = [
    { 
      href: '/dashboard', 
      label: 'Início',
      icon: Home
    },
    { 
      href: '/clientes', 
      label: 'Clientes',
      icon: Users
    },
    { 
      href: '/visitas/rapida', 
      label: 'Registrar',
      isAction: true,
      icon: Zap
    },
    { 
      href: '/pendencias', 
      label: 'Pendências',
      icon: CheckSquare
    },
    { 
      href: '/dashboard/financeiro', 
      label: 'Financeiro',
      icon: Wallet
    }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 border-t border-zinc-800/50 backdrop-blur-lg pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          if (item.isAction) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center -mt-8 px-2">
                <div className="size-14 rounded-2xl bg-[#0466C8] shadow-lg shadow-blue-900/40 flex items-center justify-center text-white active:scale-95 transition-transform">
                  <Icon size={24} strokeWidth={2.5} />
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
              className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors ${
                isActive ? 'text-sky-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2.0} />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-sky-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
