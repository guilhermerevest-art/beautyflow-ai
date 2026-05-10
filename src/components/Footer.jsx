export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">B</span>
              </div>
              <span className="font-bold text-white text-lg">BeautyFlow AI</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Sistema de agendamento inteligente para salões e estúdios de estética. Simples, bonito e poderoso.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
              <li><a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Central de ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Falar no WhatsApp</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span>© 2026 BeautyFlow AI. Todos os direitos reservados.</span>
          <span>Feito com 💕 para profissionais de estética</span>
        </div>
      </div>
    </footer>
  )
}
