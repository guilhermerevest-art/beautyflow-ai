import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import AgendamentoModal from '../components/AgendamentoModal'
import AgendamentoDetalhe from '../components/AgendamentoDetalhe'
import { toast } from 'react-hot-toast'

const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

const STATUS_BADGE = {
  agendado: 'primary',
  confirmado: 'success',
  concluido: 'default',
  cancelado: 'danger',
}

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function Agenda() {
  const { studio, profissional, isDona } = useAuth()
  const [profissionais, setProfissionais] = useState([])
  const [profSelecionado, setProfSelecionado] = useState(null)
  const [semanaBase, setSemanaBase] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    d.setHours(0,0,0,0)
    return d
  })
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i))

  useEffect(() => {
    if (!studio) return
    if (isDona) {
      supabase
        .from('estudoEstetica_profissional')
        .select('id, nome')
        .eq('studio_id', studio.id)
        .eq('ativo', true)
        .then(({ data }) => {
          setProfissionais(data || [])
          if (data?.length) setProfSelecionado(data[0].id)
        })
    } else {
      setProfSelecionado(profissional.id)
    }
  }, [studio, isDona, profissional])

  useEffect(() => {
    if (!profSelecionado || !studio) return
    loadAgendamentos()
  }, [profSelecionado, semanaBase, studio])

  const loadAgendamentos = async () => {
    setLoading(true)
    try {
      const inicio = toDateStr(semanaBase)
      const fim = toDateStr(addDays(semanaBase, 6))
      const { data, error } = await supabase
        .from('estudoEstetica_agendamento')
        .select('*, estudoEstetica_servico(nome, duracao_min, preco), estudoEstetica_cliente(nome, whatsapp)')
        .eq('profissional_id', profSelecionado)
        .gte('data', inicio)
        .lte('data', fim)
        .order('horario')
      if (error) throw error
      setAgendamentos(data || [])
    } catch (err) {
      toast.error('Não foi possível carregar a agenda. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getAgendamento = (dia, horario) => {
    const dataStr = toDateStr(dia)
    return agendamentos.find(a => a.data === dataStr && a.horario.slice(0,5) === horario)
  }

  const abrirSlot = (dia, horario) => {
    const ag = getAgendamento(dia, horario)
    if (ag) {
      setDetalhe(ag)
    } else {
      setSlotSelecionado({ data: toDateStr(dia), horario })
      setModalNovo(true)
    }
  }

  const hoje = toDateStr(new Date())

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Semana de {semanaBase.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a {addDays(semanaBase, 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDona && profissionais.length > 0 && (
            <select
              value={profSelecionado || ''}
              onChange={e => setProfSelecionado(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSemanaBase(d => addDays(d, -7))}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() - d.getDay() + 1)
                d.setHours(0,0,0,0)
                setSemanaBase(d)
              }}
              className="text-xs font-medium text-primary-600 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => setSemanaBase(d => addDays(d, 7))}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <Button onClick={() => { setSlotSelecionado(null); setModalNovo(true) }}>+ Agendar</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-16 px-3 py-3 text-xs font-semibold text-gray-400 text-left">Hora</th>
                {diasSemana.map((dia, i) => {
                  const dStr = toDateStr(dia)
                  const isHoje = dStr === hoje
                  return (
                    <th key={i} className={`px-2 py-3 text-center text-xs font-semibold ${isHoje ? 'text-primary-700' : 'text-gray-500'}`}>
                      <div className={`inline-flex flex-col items-center gap-0.5`}>
                        <span className="uppercase">{dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isHoje ? 'gradient-primary text-white' : ''}`}>
                          {dia.getDate()}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((horario) => (
                <tr key={horario} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-1.5 text-xs text-gray-400 font-medium">{horario}</td>
                  {diasSemana.map((dia, i) => {
                    const ag = getAgendamento(dia, horario)
                    return (
                      <td key={i} className="px-1 py-1 text-center">
                        {ag ? (
                          <button
                            onClick={() => setDetalhe(ag)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80
                              ${ag.status === 'cancelado' ? 'bg-gray-100 text-gray-400 line-through' :
                                ag.status === 'concluido' ? 'bg-gray-100 text-gray-500' :
                                'bg-primary-100 text-primary-800 border border-primary-200'}`}
                          >
                            <div className="truncate">{ag.estudoEstetica_cliente?.nome || 'Cliente'}</div>
                            <div className="truncate text-primary-600 font-normal">{ag.estudoEstetica_servico?.nome}</div>
                          </button>
                        ) : (
                          <button
                            onClick={() => abrirSlot(dia, horario)}
                            className="w-full h-8 rounded-lg hover:bg-primary-50 hover:border hover:border-primary-200 transition-all"
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AgendamentoModal
        open={modalNovo}
        onClose={() => { setModalNovo(false); setSlotSelecionado(null) }}
        onSaved={() => { setModalNovo(false); setSlotSelecionado(null); loadAgendamentos() }}
        profissionalId={profSelecionado}
        slotInicial={slotSelecionado}
      />

      {detalhe && (
        <AgendamentoDetalhe
          agendamento={detalhe}
          onClose={() => setDetalhe(null)}
          onUpdated={() => { setDetalhe(null); loadAgendamentos() }}
        />
      )}
    </DashboardLayout>
  )
}
