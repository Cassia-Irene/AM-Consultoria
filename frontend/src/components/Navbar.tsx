'use client'
// src/components/Navbar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Início' },
    { href: '/dashboard/financeiro', label: 'Financeiro' },
    { href: '/contratos', label: 'Contratos' },
    { href: '/projetos', label: 'Projetos' },
    { href: '/pendencias', label: 'Pendências' },
  ]

  return (
    <nav className="w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-white">AM</span>
          </div>
          <span className="text-white font-black tracking-tighter text-sm uppercase">Consultoria</span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {links.map(link => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                  isActive ? 'text-sky-400' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <span className="text-[10px] font-bold text-zinc-400">US</span>
        </div>
      </div>
    </nav>
  )
}
