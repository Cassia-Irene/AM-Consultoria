'use client'

import React, { useEffect, useState } from 'react'

interface OperationalDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function OperationalDrawer({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer 
}: OperationalDrawerProps) {
  const [mounted, setMounted] = useState(false)

  // Prevenir scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true))
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside 
        className={`fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-[#0d1117] border-l border-zinc-800/50 z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="px-6 pt-10 pb-6 border-b border-zinc-800/50">
          <div className="flex items-start justify-between mb-4">
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors p-1 -ml-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 bg-zinc-900 px-2 py-1 rounded">
              Detalhe Contextual
            </span>
          </div>
          <h2 className="text-white text-xl font-black tracking-tight leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-zinc-500 text-xs mt-1 font-medium">{subtitle}</p>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className="px-6 py-6 border-t border-zinc-800/50 bg-zinc-900/20">
            {footer}
          </footer>
        )}
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #23272F;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3F444E;
        }
      `}</style>
    </>
  )
}
