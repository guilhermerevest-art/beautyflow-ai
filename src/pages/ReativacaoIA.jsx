import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

const MENSAGENS_TEMPLATE = [
  (nome) => `Oi ${nome}! 💕 Sentimos sua falta por aqui. Que tal agendar um horário essa semana? Temos novidades esperando por você! 🌸`,
  (nome) => `Olá ${nome}! Faz um tempinho que não te vemos por aqui 😊 Que tal mimar-se um pouco? Agende agora e cuide de você! ✨`,
  (nome) => `${nome}, você sumiu! 🌺 Sua pele está com saudade dos nossos cuidados. Que tal marcar um horário? Temos horários disponíveis essa semana!`,
]

export default function ReativacaoIA() {
  const { studio } = useAuth()
  const [inativos, setInativos] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensagens, setMensagens] = useState({})
  const [diasSemAgendamento, setDiasSemAgendamento] = useState(15)

  const analisar = async () => {
    setLoading(true)
    try {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - diasSemAgendamento)
      const dataLimiteStr = dataLimite.toISOString().split('T')[0]

      // Busca todos os clientes do studio
      const { data: clientes, error: errClientes } = await supabase
        .from('estudoEstetica_cliente')
        .select('id, nome, whatsapp')
        .eq('studio_id', studio.id)
      if (errClientes) throw errClientes

      // Busca agendamentos recentes (não cancelados)
      const { data: agendamentos, error: errAgs } = await supabase
        .from('estudoEstetica_agendamento')
        .select('cliente_id, data')
        .eq('studio_id', studio.id)
        .neq('status', 'cancelado')
        .gte('data', dataLimiteStr)
      if (errAgs) throw errAgs

      const clientesAtivos = new Set(agendamentos.map(a => a.cliente_id))

      // Busca último agendamento de cada cliente inativo
      const clientesInativos = clientes.filter(c => !clientesAtivos.has(c.id))

      if (clientesInativos.length === 0) {
        toast.success('Nenhum cliente inativo encontrado!')
        setInativos([])
        setLoading(false)
        return
      }

      // Busca último agendamento de cada inativo
      const { data: ultimosAgs } = await supabase
        .from('estudoEstetica_agendamento')
        .select('cliente_id, data')
        .eq('studio_id', studio.id)
        .neq('status', 'cancelado')
        .in('cliente_id', clientesInativos.map(c => c.id))
        .order('data', { ascending: false })

      const ultimoPorCliente = {}
      ultimosAgs?.forEach(ag => {
        if (!ultimoPorCliente[ag.cliente_id]) ultimoPorCliente[ag.cliente_id] = ag.data
      })

      const resultado = clientesInativos.map((c, i) => {
        const ultimaVisita = ultimoPorCliente[c.id]
        const diasSem = ultimaVisita
          ? Math.floor((new Date() - new Date(ultimaVisita)) / (1000 * 60 * 60 * 24))
          : null
        return { ...c, ultimaVisita, diasSem }
      }).sort((a, b) => (b.diasSem || 999) - (a.diasSem || 999))

      setInativos(resultado)

      // Gera mensagens template para cada cliente
      const msgs = {}
      resultado.forEach((c, i) => {
        msgs[c.id] = MENSAGENS_TEMPLATE[i % MENSAGENS_TEMPLATE.length](c.nome.split(' ')[0])
      })
      setMensagens(msgs)

      toast.success(`${resultado.length} cliente(s) inativo(s) encontrado(s)`)
    } catch (err) {
      toast.error('Erro ao analisar clientes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></span>
          IA de Reativação
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reativar clientes</h1>
        <p className="text-gray-500 text-sm mt-0.5">Identifique clientes que sumiram e envie mensagens personalizadas</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Clientes sem agendamento há mais de</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={diasSemAgendamento}
                onChange={e => setDiasSemAgendamento(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <span className="text-sm text-gray-500">dias</span>
            </div>
          </div>
          <Button onClick={analisar} disabled={loading}>
            {loading ? 'Analisando...' : '✨ Analisar clientes inativos'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {!loading && inativos.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🤖</div>
          <p className="font-medium text-gray-600">Clique em "Analisar" para identificar clientes inativos</p>
          <p className="text-sm mt-1">A IA vai sugerir mensagens personalizadas para cada uma</p>
        </div>
      )}

      {!loading && inativos.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 font-medium">{inativos.length} cliente(s) para reativar</p>
          {inativos.map(cliente => (
            <div key={cliente.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {cliente.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cliente.nome}</p>
                    <p className="text-xs text-gray-400">
                      {cliente.diasSem !== null
                        ? `${cliente.diasSem} dias sem visita — última: ${new Date(cliente.ultimaVisita + 'T12:00:00').toLocaleDateString('pt-BR')}`
                        : 'Nunca agendou'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  cliente.diasSem > 30 ? 'bg-red-100 text-red-600' :
                  cliente.diasSem > 20 ? 'bg-amber-100 text-amber-600' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  {cliente.diasSem !== null ? `${cliente.diasSem}d` : 'Novo'}
                </span>
              </div>

              <textarea
                value={mensagens[cliente.id] || ''}
                onChange={e => setMensagens(prev => ({ ...prev, [cliente.id]: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 mb-3"
              />

              <a
                href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensagens[cliente.id] || '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar via WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
