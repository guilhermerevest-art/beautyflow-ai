import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Spinner } from '../components/ui/Spinner'
import AgendamentoModal from '../components/AgendamentoModal'

export default function Dashboard() {
  const { profissional, studio, isDona } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [agendamentosHoje, setAgendamentosHoje] = useState([])
  const [aniversariantes, setAniversariantes] = useState([])
  const [pacotesExpirando, setPacotesExpirando] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAgendar, setModalAgendar] = useState(false)

  useEffect(() => {
    if (!studio) return
    loadDashboard()
  }, [studio])

  const loadDashboard = async () => {
    setLoading(true)
    const hoje = new Date().toISOString().split('T')[0]
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const limite15dias = new Date()
    limite15dias.setDate(limite15dias.getDate() - 15)
    const limite15Str = limite15dias.toISOString().split('T')[0]
    const em7dias = new Date()
    em7dias.setDate(em7dias.getDate() + 7)
    const em7diasStr = em7dias.toISOString().split('T')[0]

    try {
      const queries = [
        supabase.from('estudoEstetica_agendamento')
          .select('id, horario, status, estudoEstetica_cliente:cliente_id(nome), estudoEstetica_servico:servico_id(nome, preco)')
          .eq('studio_id', studio.id)
          .eq('data', hoje)
          .neq('status', 'cancelado')
          .order('horario'),
        supabase.from('estudoEstetica_cliente')
          .select('id', { count: 'exact', head: true })
          .eq('studio_id', studio.id),
        supabase.from('estudoEstetica_cliente')
          .select('id, nome, data_nascimento, whatsapp')
          .eq('studio_id', studio.id)
          .not('data_nascimento', 'is', null),
        supabase.from('estudoEstetica_pacote_cliente')
          .select('*, estudoEstetica_pacote_definicao:pacote_id(nome, sessoes), estudoEstetica_cliente:cliente_id(nome)')
          .lte('data_expiracao', em7diasStr)
          .gte('data_expiracao', hoje),
      ]

      if (isDona) {
        queries.push(
          supabase.from('estudoEstetica_pagamento')
            .select('valor')
            .eq('studio_id', studio.id)
            .gte('data', inicioMes),
          supabase.from('estudoEstetica_agendamento')
            .select('cliente_id')
            .eq('studio_id', studio.id)
            .gte('data', limite15Str)
            .neq('status', 'cancelado'),
        )
      }

      const results = await Promise.all(queries)
      const [agsHoje, totalClientes, clientesNasc, pacExp, pagamentos, agsRecentes] = results

      setAgendamentosHoje(agsHoje.data || [])

      const mesAtual = new Date().getMonth() + 1
      const anivs = (clientesNasc.data || []).filter(c => {
        if (!c.data_nascimento) return false
        const mes = parseInt(c.data_nascimento.split('-')[1], 10)
        return mes === mesAtual
      })
      setAniversariantes(anivs)
      setPacotesExpirando(pacExp.data || [])

      const receitaMes = isDona
        ? (pagamentos?.data || []).reduce((acc, p) => acc + Number(p.valor), 0)
        : null

      const clientesAtivos = isDona
        ? new Set((agsRecentes?.data || []).map(a => a.cliente_id)).size
        : null

      const inativos = isDona
        ? (totalClientes.count || 0) - clientesAtivos
        : null

      setMetrics({
        agendamentosHoje: agsHoje.data?.length || 0,
        totalClientes: totalClientes.count || 0,
        receitaMes,
        inativos: Math.max(0, inativos),
      })
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const STATUS_COLOR = {
    agendado: 'bg-primary-100 text-primary-700 border-primary-200',
    confirmado: 'bg-green-100 text-green-700 border-green-200',
    concluido: 'bg-gray-100 text-gray-500 border-gray-200',
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {profissional?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{studio?.nome}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center text-xl mb-3">📅</div>
              <div className="text-2xl font-bold text-gray-900">{metrics?.agendamentosHoje}</div>
              <div className="text-sm text-gray-500 mt-0.5">Agendamentos hoje</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl mb-3">👥</div>
              <div className="text-2xl font-bold text-gray-900">{metrics?.totalClientes}</div>
              <div className="text-sm text-gray-500 mt-0.5">Clientes cadastradas</div>
            </div>
            {isDona && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center text-xl mb-3">💰</div>
                  <div className="text-2xl font-bold text-gray-900">R$ {metrics?.receitaMes?.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 mt-0.5">Receita do mês</div>
                </div>
                <Link to="/reativacao" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl mb-3">🤖</div>
                  <div className="text-2xl font-bold text-gray-900">{metrics?.inativos}</div>
                  <div className="text-sm text-gray-500 mt-0.5">Clientes para reativar</div>
                </Link>
              </>
            )}
          </div>

          {/* Alertas: aniversariantes e pacotes expirando */}
          {(aniversariantes.length > 0 || pacotesExpirando.length > 0) && (
            <div className="space-y-3 mb-6">
              {aniversariantes.length > 0 && (
                <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎂</span>
                    <span className="font-semibold text-pink-800 text-sm">Aniversariantes do mês ({aniversariantes.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aniversariantes.map(c => (
                      <a
                        key={c.id}
                        href={`https://wa.me/55${c.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Feliz aniversário, ${c.nome.split(' ')[0]}! 🎉`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors"
                      >
                        {c.nome.split(' ')[0]} · {c.data_nascimento?.split('-')[2]}/{c.data_nascimento?.split('-')[1]}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {pacotesExpirando.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⏰</span>
                    <span className="font-semibold text-amber-800 text-sm">Pacotes expirando em 7 dias ({pacotesExpirando.length})</span>
                  </div>
                  <div className="space-y-1">
                    {pacotesExpirando.map(pc => (
                      <div key={pc.id} className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-medium">{pc.estudoEstetica_cliente?.nome} — {pc.estudoEstetica_pacote_definicao?.nome}</span>
                        <span className="text-amber-500">{new Date(pc.data_expiracao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agenda do dia */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Agenda de hoje</h2>
              <Link to="/agenda" className="text-sm text-primary-600 hover:text-primary-800 font-medium">Ver agenda completa →</Link>
            </div>
            {agendamentosHoje.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {agendamentosHoje.map(ag => (
                  <div key={ag.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-sm font-bold text-gray-500 w-12 flex-shrink-0">{ag.horario?.slice(0,5)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{ag.estudoEstetica_cliente?.nome || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{ag.estudoEstetica_servico?.nome}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLOR[ag.status] || 'bg-gray-100 text-gray-500'}`}>
                      {ag.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Botão flutuante agendar — mobile */}
      <button
        onClick={() => setModalAgendar(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 gradient-primary rounded-full shadow-lg shadow-primary-300 flex items-center justify-center text-white text-2xl hover:opacity-90 transition-opacity"
        aria-label="Novo agendamento"
      >
        +
      </button>

      <AgendamentoModal
        open={modalAgendar}
        onClose={() => setModalAgendar(false)}
        onSaved={() => { setModalAgendar(false); loadDashboard() }}
        profissionalId={profissional?.id}
      />
    </DashboardLayout>
  )
}