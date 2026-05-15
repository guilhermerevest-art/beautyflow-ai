const features = [
  {
    icon: '📅',
    title: 'Agendamento Online',
    description: 'Sua cliente agenda sozinha pelo link do seu salão, 24h por dia. Sem telefone, sem vai-e-vem no WhatsApp.',
  },
  {
    icon: '💼',
    title: 'Controle de Pacotes',
    description: 'Venda pacotes de sessões e acompanhe quantas cada cliente já usou. Nunca mais perca o controle.',
  },
  {
    icon: '🤖',
    title: 'IA de Reativação',
    description: 'A IA identifica clientes que sumiram há 15+ dias e sugere mensagens personalizadas para trazê-las de volta.',
  },
  {
    icon: '💰',
    title: 'Financeiro Integrado',
    description: 'Registre pagamentos (dinheiro, pix, cartão) e veja o caixa do dia com relatórios por período.',
  },
  {
    icon: '📦',
    title: 'Estoque de Produtos',
    description: 'Controle o estoque dos produtos usados nos atendimentos e venda avulso. Alerta automático de estoque baixo.',
  },
  {
    icon: '👥',
    title: 'Multi-profissional',
    description: 'Cadastre suas ajudantes com acesso apenas à própria agenda. Você mantém o controle total do negócio.',
  },
]

export default function Features() {
  return (
    <section id="funcionalidades" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Funcionalidades</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3 mb-4">
            Tudo que seu salão precisa,{' '}
            <span className="text-gradient">em um só sistema</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Do agendamento ao financeiro, do estoque à reativação de clientes — Meu Salão cobre cada parte do seu negócio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-primary-100 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
