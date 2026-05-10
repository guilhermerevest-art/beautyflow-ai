const testimonials = [
  {
    name: 'Camila Rodrigues',
    role: 'Estúdio Camila Beauty — SP',
    avatar: 'CR',
    text: 'Antes eu perdia horas no WhatsApp confirmando horários. Agora as clientes agendam sozinhas e eu só apareço para atender. Minha agenda nunca esteve tão cheia.',
  },
  {
    name: 'Fernanda Alves',
    role: 'Espaço Bella — RJ',
    avatar: 'FA',
    text: 'A função de reativação de clientes me surpreendeu. Na primeira semana, 5 clientes que tinham sumido voltaram depois que mandei a mensagem sugerida pela IA.',
  },
  {
    name: 'Juliana Matos',
    role: 'Studio J — BH',
    avatar: 'JM',
    text: 'O controle de pacotes era meu maior problema. Eu anotava tudo no caderno e sempre errava. Agora está tudo no sistema, automático.',
  },
]

export default function Testimonials() {
  return (
    <section id="depoimentos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Depoimentos</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
            Quem usa, <span className="text-gradient">recomenda</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex mb-3">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
