export default function Pricing() {
  const plans = [
    {
      name: 'Grátis',
      price: 'R$ 0',
      period: 'para sempre',
      description: 'Para começar e testar sem compromisso.',
      highlight: false,
      cta: 'Começar grátis',
      features: [
        '1 profissional',
        'Até 30 agendamentos/mês',
        'Página pública de agendamento',
        'Cadastro de clientes e serviços',
        'Confirmação via WhatsApp',
      ],
      missing: [
        'Controle financeiro',
        'Estoque de produtos',
        'Pacotes de sessões',
        'IA de reativação',
      ],
    },
    {
      name: 'Pro',
      price: 'R$ 79',
      period: '/mês',
      description: 'Para salões que querem crescer de verdade.',
      highlight: true,
      cta: 'Testar 30 dias grátis',
      badge: 'Mais popular',
      features: [
        'Profissionais ilimitados',
        'Agendamentos ilimitados',
        'Página pública de agendamento',
        'Controle financeiro completo',
        'Estoque de produtos',
        'Pacotes de sessões',
        'IA de reativação de clientes',
        'Relatórios por período',
        'Suporte prioritário',
      ],
      missing: [],
    },
  ]

  return (
    <section id="planos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Planos</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
            Simples e <span className="text-gradient">sem surpresas</span>
          </h2>
          <p className="text-gray-500 text-lg">Comece grátis. Faça upgrade quando precisar.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 items-start">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 border-2 relative ${
                plan.highlight
                  ? 'border-primary-600 shadow-2xl shadow-primary-100'
                  : 'border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 text-xl mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-gradient' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-sm">{plan.description}</p>
              </div>

              <a
                href="#"
                className={`block text-center font-semibold py-3 rounded-full mb-6 transition-opacity ${
                  plan.highlight
                    ? 'gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary-200'
                    : 'border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700'
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Sem contrato. Cancele quando quiser. Cartão não é necessário para o plano grátis.
        </p>
      </div>
    </section>
  )
}
