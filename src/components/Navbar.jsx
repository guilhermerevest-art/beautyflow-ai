import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-primary-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">BeautyFlow <span className="text-gradient">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#funcionalidades" className="hover:text-primary-700 transition-colors">Funcionalidades</a>
            <a href="#diferenciais" className="hover:text-primary-700 transition-colors">Diferenciais</a>
            <a href="#planos" className="hover:text-primary-700 transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-primary-700 transition-colors">Depoimentos</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-primary-700 transition-colors">Entrar</Link>
            <a href="#planos" className="gradient-primary text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
              Começar grátis
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
