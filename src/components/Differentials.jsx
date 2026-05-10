export default function Differentials() {
  return (
    <section id="diferenciais" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Diferenciais</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
            Por que BeautyFlow AI é{' '}
            <span className="text-gradient">diferente</span>
          </h2>
        </div>

        {/* IA de Reativação — destaque */}
        <div className="gradient-primary rounded-3xl p-8 sm:p-12 mb-8 text-white overflow-hidden relative">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                ✨ Exclusivo BeautyFlow AI
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-4">
                IA que traz suas clientes de volta
              </h3>
              <p className="text-white/80 leading-relaxed mb-6">
                Toda semana, a IA analisa sua base de clientes e identifica quem não voltou há 15 dias ou mais. Ela gera uma mensagem personalizada para cada uma — você só clica e envia pelo WhatsApp.
              </p>
              <div className="flex items-center gap-3 text-sm font-medium">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <span>📈</span> Média de 23% de retorno
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
              <div className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">Sugestão da IA</div>
              {[
                { name: 'Mariana S.', days: '18 dias', msg: '"Oi Mariana! Sentimos sua falta 💕 Que tal agendar sua limpeza de pele?"' },
                { name: 'Patrícia R.', days: '22 dias', msg: '"Oi Patrícia! Seu pacote de massagem ainda tem 2 sessões disponíveis 🌸"' },
              ].map((item, i) => (
                <div key={i} className="mb-3 last:mb-0 bg-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{item.days} sem visita</span>
                  </div>
                  <p className="text-xs text-white/80 italic">{item.msg}</p>
                  <button className="mt-2 text-xs bg-white text-primary-700 font-semibold px-3 py-1 rounded-full hover:bg-primary-50 transition-colors">
                    Enviar via WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Outros diferenciais */}
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: '🔗',
              title: 'Link de agendamento próprio',
              description: 'Cada salão tem seu link exclusivo (beautyflow.app/agendar/seu-salao) para compartilhar onde quiser.',
            },
            {
              icon: '📱',
              title: '100% mobile',
              description: 'Sua cliente agenda pelo celular sem instalar nada. Você gerencia tudo pelo celular também.',
            },
            {
              icon: '🔒',
              title: 'Dados seguros',
              description: 'Seus dados e os das suas clientes ficam protegidos com criptografia e backups automáticos.',
            },
          ].map((d, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="text-3xl mb-3">{d.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{d.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
