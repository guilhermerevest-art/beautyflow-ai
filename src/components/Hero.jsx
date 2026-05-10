export default function Hero() {
  return (
    <section className="gradient-hero pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></span>
              Inteligência Artificial para o seu salão
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Sua agenda cheia,{' '}
              <span className="text-gradient">sem esforço</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              BeautyFlow AI automatiza agendamentos, controla pacotes de sessões e usa IA para reativar clientes que sumiram — tudo em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#planos"
                className="gradient-primary text-white font-semibold px-8 py-4 rounded-full text-center hover:opacity-90 transition-opacity shadow-lg shadow-primary-200"
              >
                Começar grátis agora
              </a>
              <a
                href="#funcionalidades"
                className="flex items-center justify-center gap-2 text-gray-700 font-semibold px-8 py-4 rounded-full border border-gray-200 hover:border-primary-300 hover:text-primary-700 transition-colors"
              >
                Ver como funciona
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-primary-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-xs text-gray-500 mt-0.5">Salões ativos</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-xs text-gray-500 mt-0.5">Satisfação</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">30 dias</div>
                <div className="text-xs text-gray-500 mt-0.5">Grátis para testar</div>
              </div>
            </div>
          </div>

          {/* Mock UI */}
          <div className="relative hidden lg:block">
            <div className="absolute -top-8 -right-8 w-72 h-72 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-primary-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-white/80 text-xs mx-auto">beautyflow.app/admin</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-gray-800 text-sm">Agenda — Hoje</span>
                  <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full">6 agendamentos</span>
                </div>
                {[
                  { time: '09:00', client: 'Ana Paula', service: 'Limpeza de Pele', color: 'bg-primary-100 border-primary-300' },
                  { time: '10:30', client: 'Carla Mendes', service: 'Design de Sobrancelha', color: 'bg-pink-50 border-pink-200' },
                  { time: '13:00', client: 'Juliana Costa', service: 'Massagem Relaxante', color: 'bg-purple-50 border-purple-200' },
                  { time: '15:00', client: 'Fernanda Lima', service: 'Peeling Químico', color: 'bg-primary-100 border-primary-300' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border mb-2 ${item.color}`}>
                    <span className="text-xs font-bold text-gray-500 w-10">{item.time}</span>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{item.client}</div>
                      <div className="text-xs text-gray-500">{item.service}</div>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                ))}
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <span className="text-amber-500 text-sm">✨</span>
                  <span className="text-xs text-amber-700 font-medium">IA: 3 clientes para reativar hoje</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
