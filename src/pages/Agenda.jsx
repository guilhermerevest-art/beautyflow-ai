import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import AgendamentoModal from '../components/AgendamentoModal'
import AgendamentoDetalhe from '../components/AgendamentoDetalhe'
import { toast } from 'react-hot-toast'

const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function semanaDeData(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const STATUS_STYLE = {
  cancelado: 'bg-gray-100 text-gray-400 line-through',
  concluido: 'bg-gray-100 text-gray-500',
  confirmado: 'bg-green-50 text-green-800 border border-green-200',
  agendado: 'bg-primary-100 text-primary-800 border border-primary-200',
}

const STATUS_LABEL = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function Agenda() {
  const { studio, profissional, isDona } = useAuth()
  const [profissionais, setProfissionais] = useState([])
  const [profSelecionado, setProfSelecionado] = useState(null)
  const [semanaBase, setSemanaBase] = useState(() => semanaDeData(new Date()))
  const [diaSelecionado, setDiaSelecionado] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  })
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNovo, setModalNovo] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i))
  const hoje = toDateStr(new Date())

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

  const getAgendamento = (dia, horario) =>
    agendamentos.find(a => a.data === toDateStr(dia) && a.horario.slice(0, 5) === horario)

  const abrirSlot = (dia, horario) => {
    const ag = getAgendamento(dia, horario)
    if (ag) { setDetalhe(ag) }
    else { setSlotSelecionado({ data: toDateStr(dia), horario }); setModalNovo(true) }
  }

  const irParaHoje = () => {
    const d = new Date(); d.setHours(0,0,0,0)
    setSemanaBase(semanaDeData(d))
    setDiaSelecionado(d)
  }

  const agsDia = agendamentos.filter(a => a.data === toDateStr(diaSelecionado))

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <div className="flex items-center gap-2">
          {isDona && profissionais.length > 1 && (
            <select
              value={profSelecionado || ''}
              onChange={e => setProfSelecionado(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          )}
          <button onClick={irParaHoje} className="text-xs font-medium text-primary-600 px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-colors border border-primary-200">
            Hoje
          </button>
          <Button onClick={() => { setSlotSelecionado(null); setModalNovo(true) }}>+ Agendar</Button>
        </div>
      </div>

      {/* Navegação de semana */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => { setSemanaBase(d => addDays(d, -7)); setDiaSelecionado(d => addDays(d, -7)) }}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-600">
          {semanaBase.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {addDays(semanaBase, 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
        <button onClick={() => { setSemanaBase(d => addDays(d, 7)); setDiaSelecionado(d => addDays(d, 7)) }}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Seletor de dias (sempre visível) */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {diasSemana.map((dia, i) => {
          const dStr = toDateStr(dia)
          const isHoje = dStr === hoje
          const isSel = dStr === toDateStr(diaSelecionado)
          const temAg = agendamentos.some(a => a.data === dStr && a.status !== 'cancelado')
          return (
            <button
              key={i}
              onClick={() => setDiaSelecionado(dia)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all
                ${isSel ? 'gradient-primary text-white shadow-md' : isHoje ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <span className="text-[10px] font-semibold uppercase">
                {dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </span>
              <span className={`text-base font-bold leading-tight ${isSel ? 'text-white' : ''}`}>{dia.getDate()}</span>
              {temAg && !isSel && <span className="w-1 h-1 rounded-full bg-primary-400 mt-0.5" />}
              {temAg && isSel && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Mobile: lista do dia selecionado */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">
                {diaSelecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </h2>
              <span className="text-xs text-gray-400">{agsDia.filter(a => a.status !== 'cancelado').length} agendamentos</span>
            </div>
            <div className="space-y-2">
              {HORARIOS.map(horario => {
                const ag = getAgendamento(diaSelecionado, horario)
                if (!ag) {
                  return (
                    <button
                      key={horario}
                      onClick={() => abrirSlot(diaSelecionado, horario)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                    >
                      <span className="text-xs font-bold text-gray-400 w-10 flex-shrink-0">{horario}</span>
                      <span className="text-xs text-gray-300 group-hover:text-primary-400">+ Agendar</span>
                    </button>
                  )
                }
                return (
                  <button
                    key={horario}
                    onClick={() => setDetalhe(ag)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-80 ${STATUS_STYLE[ag.status] || STATUS_STYLE.agendado}`}
                  >
                    <span className="text-xs font-bold w-10 flex-shrink-0">{horario}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ag.estudoEstetica_cliente?.nome || '—'}</p>
                      <p className="text-xs opacity-70 truncate">{ag.estudoEstetica_servico?.nome}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-medium opacity-60">{STATUS_LABEL[ag.status]}</span>
                      {ag.estudoEstetica_servico?.preco && (
                        <span className="text-xs font-bold">R$ {Number(ag.estudoEstetica_servico.preco).toFixed(0)}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Desktop: tabela semanal */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-16 px-3 py-3 text-xs font-semibold text-gray-400 text-left">Hora</th>
                  {diasSemana.map((dia, i) => {
                    const dStr = toDateStr(dia)
                    const isHoje = dStr === hoje
                    return (
                      <th key={i} className={`px-2 py-3 text-center text-xs font-semibold ${isHoje ? 'text-primary-700' : 'text-gray-500'}`}>
                        <div className="inline-flex flex-col items-center gap-0.5">
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
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 ${STATUS_STYLE[ag.status] || STATUS_STYLE.agendado}`}
                            >
                              <div className="truncate">{ag.estudoEstetica_cliente?.nome || 'Cliente'}</div>
                              <div className="truncate opacity-70 font-normal">{ag.estudoEstetica_servico?.nome}</div>
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
        </>
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
