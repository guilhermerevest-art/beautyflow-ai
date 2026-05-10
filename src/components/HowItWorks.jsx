export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Crie sua conta grátis',
      description: 'Cadastre seu estúdio em menos de 2 minutos. Sem cartão de crédito.',
    },
    {
      number: '02',
      title: 'Configure seus serviços',
      description: 'Adicione seus serviços, preços e profissionais. Simples e rápido.',
    },
    {
      number: '03',
      title: 'Compartilhe seu link',
      description: 'Envie o link de agendamento para suas clientes pelo WhatsApp ou Instagram.',
    },
    {
      number: '04',
      title: 'Gerencie tudo no painel',
      description: 'Acompanhe agenda, financeiro, estoque e deixe a IA trabalhar por você.',
    },
  ]

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Como funciona</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
            Pronto em <span className="text-gradient">4 passos</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-primary-200 z-0" style={{ width: 'calc(100% - 2rem)' }}></div>
              )}
              <div className="relative z-10">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary-200">
                  <span className="text-white font-extrabold text-lg">{step.number}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
