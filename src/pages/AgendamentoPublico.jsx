import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'

const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

export default function AgendamentoPublico() {
  const { slug } = useParams()
  const [studio, setStudio] = useState(null)
  const [servicos, setServicos] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep] = useState(1)
  const [servico, setServico] = useState(null)
  const [profissional, setProfissional] = useState(null)
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')
  const [horariosOcupados, setHorariosOcupados] = useState([])
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [agendamentoId, setAgendamentoId] = useState(null)

  useEffect(() => {
    supabase
      .from('estudoEstetica_studio')
      .select('id, nome, slug')
      .eq('slug', slug)
      .single()
      .then(({ data: s, error }) => {
        if (error || !s) { setNotFound(true); setLoading(false); return }
        setStudio(s)
        return Promise.all([
          supabase.from('estudoEstetica_servico').select('id, nome, preco, duracao_min').eq('studio_id', s.id).eq('ativo', true).order('nome'),
          supabase.from('estudoEstetica_profissional').select('id, nome').eq('studio_id', s.id).eq('ativo', true),
        ])
      })
      .then(res => {
        if (!res) return
        const [s, p] = res
        setServicos(s.data || [])
        setProfissionais(p.data || [])
        setLoading(false)
      })
  }, [slug])

  useEffect(() => {
    if (!data || !profissional) return
    supabase
      .from('estudoEstetica_agendamento')
      .select('horario')
      .eq('profissional_id', profissional.id)
      .eq('data', data)
      .neq('status', 'cancelado')
      .then(({ data: ags }) => setHorariosOcupados((ags || []).map(a => a.horario.slice(0,5))))
  }, [data, profissional])

  const confirmar = async () => {
    if (!nome.trim() || !whatsapp.trim()) return
    setSalvando(true)
    try {
      // Busca ou cria cliente
      let clienteId = null
      const { data: clienteExistente } = await supabase
        .from('estudoEstetica_cliente')
        .select('id')
        .eq('studio_id', studio.id)
        .eq('whatsapp', whatsapp.replace(/\D/g, ''))
        .single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
      } else {
        const { data: novoCliente } = await supabase
          .from('estudoEstetica_cliente')
          .insert({ studio_id: studio.id, nome, whatsapp: whatsapp.replace(/\D/g, '') })
          .select('id')
          .single()
        clienteId = novoCliente?.id
      }

      const { data: ag } = await supabase
        .from('estudoEstetica_agendamento')
        .insert({
          studio_id: studio.id,
          profissional_id: profissional.id,
          servico_id: servico.id,
          cliente_id: clienteId,
          data,
          horario,
          status: 'agendado',
        })
        .select('id')
        .single()

      setAgendamentoId(ag?.id)
      setConcluido(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const whatsappLink = concluido && studio
    ? `https://wa.me/55${whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá! Seu agendamento foi confirmado 💕\n\n📍 ${studio.nome}\n✂️ ${servico?.nome}\n👤 ${profissional?.nome}\n📅 ${new Date(data+'T12:00:00').toLocaleDateString('pt-BR')} às ${horario}\n\nAté lá! 🌸`)}`
    : null

  const dataMin = new Date().toISOString().split('T')[0]

  if (loading) return (
    <div className="min-h-screen gradient-hero flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Estúdio não encontrado</h1>
        <p className="text-gray-500">Verifique o link e tente novamente.</p>
      </div>
    </div>
  )

  if (concluido) return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
        <p className="text-gray-500 mb-6">Clique abaixo para receber a confirmação no WhatsApp.</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Serviço</span><span className="font-medium">{servico?.nome}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Profissional</span><span className="font-medium">{profissional?.nome}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Data</span><span className="font-medium">{new Date(data+'T12:00:00').toLocaleDateString('pt-BR')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Horário</span><span className="font-medium">{horario}</span></div>
        </div>
        <a href={whatsappLink} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Receber confirmação no WhatsApp
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen gradient-hero py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-gray-900 text-xl">{studio.nome}</span>
          </div>
          <p className="text-gray-500 text-sm">Agende seu horário online</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-primary-600' : s < step ? 'w-4 bg-primary-300' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">

          {/* Step 1: Serviço */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-gray-900 text-lg mb-4">Escolha o serviço</h2>
              <div className="space-y-2">
                {servicos.map(s => (
                  <button key={s.id} onClick={() => { setServico(s); setStep(2) }}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                    <div>
                      <div className="font-semibold text-gray-900">{s.nome}</div>
                      <div className="text-sm text-gray-500">{s.duracao_min} min</div>
                    </div>
                    <span className="font-bold text-primary-700">R$ {Number(s.preco).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Profissional */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Voltar
              </button>
              <h2 className="font-bold text-gray-900 text-lg mb-4">Escolha a profissional</h2>
              <div className="space-y-2">
                {profissionais.map(p => (
                  <button key={p.id} onClick={() => { setProfissional(p); setStep(3) }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                    <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                      {p.nome.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900">{p.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Data e horário */}
          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Voltar
              </button>
              <h2 className="font-bold text-gray-900 text-lg mb-4">Escolha a data e horário</h2>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Data</label>
                <input type="date" min={dataMin} value={data} onChange={e => { setData(e.target.value); setHorario('') }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              {data && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Horário disponível</label>
                  <div className="grid grid-cols-4 gap-2">
                    {HORARIOS.map(h => {
                      const ocupado = horariosOcupados.includes(h)
                      return (
                        <button key={h} type="button" disabled={ocupado} onClick={() => setHorario(h)}
                          className={`py-2 text-sm rounded-xl font-medium transition-colors
                            ${horario === h ? 'gradient-primary text-white' :
                              ocupado ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                              'bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                          {h}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {data && horario && (
                <Button onClick={() => setStep(4)} className="w-full mt-4">Continuar</Button>
              )}
            </div>
          )}

          {/* Step 4: Dados pessoais */}
          {step === 4 && (
            <div>
              <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Voltar
              </button>
              <h2 className="font-bold text-gray-900 text-lg mb-4">Seus dados</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nome completo</label>
                  <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ana Paula Silva"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">WhatsApp</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
              <Button onClick={() => setStep(5)} disabled={!nome.trim() || !whatsapp.trim()} className="w-full mt-4">Revisar agendamento</Button>
            </div>
          )}

          {/* Step 5: Confirmação */}
          {step === 5 && (
            <div>
              <button onClick={() => setStep(4)} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Voltar
              </button>
              <h2 className="font-bold text-gray-900 text-lg mb-4">Confirmar agendamento</h2>
              <div className="bg-primary-50 rounded-xl p-4 space-y-2 mb-6 text-sm border border-primary-100">
                <div className="flex justify-between"><span className="text-gray-500">Serviço</span><span className="font-semibold text-gray-900">{servico?.nome}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Profissional</span><span className="font-medium text-gray-900">{profissional?.nome}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Data</span><span className="font-medium text-gray-900">{new Date(data+'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Horário</span><span className="font-medium text-gray-900">{horario}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="font-bold text-primary-700">R$ {Number(servico?.preco || 0).toFixed(2)}</span></div>
                <div className="border-t border-primary-100 pt-2 flex justify-between"><span className="text-gray-500">Nome</span><span className="font-medium text-gray-900">{nome}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">WhatsApp</span><span className="font-medium text-gray-900">{whatsapp}</span></div>
              </div>
              <Button onClick={confirmar} disabled={salvando} className="w-full">
                {salvando ? 'Confirmando...' : 'Confirmar agendamento'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
