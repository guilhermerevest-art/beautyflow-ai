export default function CtaBanner() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <div className="gradient-primary rounded-3xl px-8 py-16 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Sua agenda cheia começa hoje
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Junte-se a centenas de salões que já automatizaram o agendamento e estão focando no que importa: atender bem.
            </p>
            <a
              href="#planos"
              className="inline-block bg-white text-primary-700 font-bold px-10 py-4 rounded-full hover:bg-primary-50 transition-colors shadow-xl text-lg"
            >
              Começar grátis agora
            </a>
            <p className="text-white/60 text-sm mt-4">Sem cartão de crédito. Sem compromisso.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
