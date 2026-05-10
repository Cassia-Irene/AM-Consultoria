'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DashboardTabs() {
  const pathname = usePathname()
  
  const tabs = [
    { id: 'caos', label: 'Caos', href: '/dashboard', color: 'bg-red-500' },
    { id: 'planejamento', label: 'Planejamento', href: '/dashboard/planejamento', color: 'bg-sky-500' },
    { id: 'reflexao', label: 'Reflexão', href: '/dashboard/reflexao', color: 'bg-indigo-500' }
  ]

  const getActiveTab = () => {
    if (pathname === '/dashboard/planejamento') return 'planejamento'
    if (pathname === '/dashboard/reflexao') return 'reflexao'
    return 'caos'
  }

  const activeTab = getActiveTab()

  return (
    <div className="sticky top-0 z-50 bg-[#07090D]/90 backdrop-blur-md border-b border-[#23272F] px-4 pt-8 pb-4 sm:pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center justify-center sm:justify-between">
          <h1 className="text-white text-lg sm:text-xl font-black tracking-tight">
            {activeTab === 'caos' ? 'Modo Caos' : activeTab === 'planejamento' ? 'Modo Planejamento' : 'Modo Reflexão'}
          </h1>
        </div>
        
        <div className="flex items-center gap-1 bg-[#0d1117] border border-[#23272F] p-1 rounded-full w-fit mx-auto sm:mx-0">
          {tabs.map(tab => (
            <Link 
              key={tab.id} 
              href={tab.href}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                  ? `${tab.color} text-white shadow-lg` 
                  : 'text-[#4F5B73] hover:text-[#7D8597]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <p className="hidden sm:block text-[#4F5B73] text-[10px] font-bold uppercase tracking-[0.2em] px-1">
        {activeTab === 'caos' ? 'Foco: Resolver Agora' : activeTab === 'planejamento' ? 'Foco: Organizar Semana' : 'Foco: Entender Padrões'}
      </p>
    </div>
  )
}
