import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'

export default function Dashboard() {
  const { profissional, studio } = useAuth()

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {profissional?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{studio?.nome}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Agendamentos hoje', value: '—', icon: '📅', color: 'bg-primary-50 text-primary-700' },
          { label: 'Clientes ativos', value: '—', icon: '👥', color: 'bg-blue-50 text-blue-700' },
          { label: 'Receita do mês', value: '—', icon: '💰', color: 'bg-green-50 text-green-700' },
          { label: 'Clientes inativos', value: '—', icon: '🤖', color: 'bg-amber-50 text-amber-700' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${card.color}`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
