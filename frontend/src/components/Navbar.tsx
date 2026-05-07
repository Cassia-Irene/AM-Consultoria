'use client'
// src/components/Navbar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/dashboard', label: 'Início' },
    { href: '/dashboard/financeiro', label: 'Financeiro' },
    { href: '/contratos', label: 'Contratos' },
    { href: '/projetos', label: 'Projetos' },
    { href: '/pendencias', label: 'Pendências' },
  ]

  return (
    <nav className="w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 active:scale-95 transition-transform" onClick={() => setOpen(false)}>
            <div className="w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-black text-white">AM</span>
            </div>
            <span className="text-white font-black tracking-tighter text-sm uppercase">Consultoria</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 h-full">
            {links.map(link => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all relative py-2 ${
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center">
            <span className="text-[10px] font-bold text-zinc-400">US</span>
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setOpen(prev => !prev)}
            className="md:hidden text-zinc-400 hover:text-white p-1 transition-colors"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-800/50 bg-zinc-950/95 flex flex-col p-6 gap-4 animate-in slide-in-from-top-2 duration-200">
          {links.map(link => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors py-2 flex items-center gap-3 ${
                  isActive ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {isActive && <span className="w-1 h-4 bg-sky-500 rounded-full" />}
                {link.label}
              </Link>
            )
          })}
          <div className="mt-4 pt-6 border-t border-zinc-900 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-zinc-400">US</span>
            </div>
            <div>
              <p className="text-white text-xs font-bold">Usuário</p>
              <p className="text-[10px] text-zinc-600 font-medium">Logado como Admin</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
