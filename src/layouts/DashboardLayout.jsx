import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navDona = [
  { to: '/dashboard', label: 'Início', icon: '🏠' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/financeiro', label: 'Financeiro', icon: '💰' },
  { to: '/servicos', label: 'Serviços', icon: '✂️' },
  { to: '/produtos', label: 'Produtos', icon: '📦' },
  { to: '/pacotes', label: 'Pacotes', icon: '💼' },
  { to: '/equipe', label: 'Equipe', icon: '👩‍💼' },
  { to: '/reativacao', label: 'IA Reativação', icon: '🤖' },
]

const navAjudante = [
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
]

// Bottom nav shows only the 4 most used items on mobile
const bottomNavDona = [
  { to: '/dashboard', label: 'Início', icon: '🏠' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/financeiro', label: 'Financeiro', icon: '💰' },
]

const bottomNavAjudante = [
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
]

export default function DashboardLayout({ children }) {
  const { profissional, studio, signOut, isDona } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = isDona ? navDona : navAjudante
  const bottomNav = isDona ? bottomNavDona : bottomNavAjudante

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 fixed inset-y-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-gray-900">BeautyFlow <span className="text-gradient">AI</span></span>
          </div>
          {studio && <p className="text-xs text-gray-400 mt-1 truncate">{studio.nome}</p>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${location.pathname === item.to
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {profissional?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profissional?.nome}</p>
              <p className="text-xs text-gray-400 capitalize">{profissional?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">B</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm">BeautyFlow AI</span>
            {studio && <p className="text-xs text-gray-400 leading-none">{studio.nome}</p>}
          </div>
        </div>
        {/* More menu button — shows items not in bottom nav */}
        {isDona && (
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs text-gray-500 font-medium">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
            Mais
          </button>
        )}
      </div>

      {/* Mobile slide-in menu (extra items) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-56 bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 mt-14">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mais opções</p>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {nav.filter(item => !bottomNav.find(b => b.to === item.to)).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors
                    ${location.pathname === item.to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {profissional?.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profissional?.nome}</p>
                  <p className="text-xs text-gray-400 capitalize">{profissional?.role}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {bottomNav.map((item) => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors
                ${active ? 'text-primary-700' : 'text-gray-400'}`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] ${active ? 'text-primary-700' : 'text-gray-400'}`}>{item.label}</span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 gradient-primary rounded-full" />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
