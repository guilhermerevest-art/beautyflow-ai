import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

export default function ClienteDetalhe() {
  const { id } = useParams()
  const { studio } = useAuth()
  const [cliente, setCliente] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [pacotes, setPacotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studio || !id) return
    loadCliente()
  }, [studio, id])

  const loadCliente = async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: ags }, { data: pcs }] = await Promise.all([
        supabase.from('estudoEstetica_cliente').select('*').eq('id', id).single(),
        supabase.from('estudoEstetica_agendamento')
          .select('*, estudoEstetica_servico:servico_id(nome, preco), estudoEstetica_profissional:profissional_id(nome)')
          .eq('cliente_id', id)
          .order('data', { ascending: false })
          .limit(20),
        supabase.from('estudoEstetica_pacote_cliente')
          .select('*, estudoEstetica_pacote_definicao:pacote_id(nome, sessoes)')
          .eq('cliente_id', id)
          .order('data_compra', { ascending: false }),
      ])
      setCliente(c)
      setAgendamentos(ags || [])
      setPacotes(pcs || [])
    } catch (err) {
      toast.error('Erro ao carregar cliente')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const STATUS_BADGE = {
    agendado: 'primary', confirmado: 'success', concluido: 'default', cancelado: 'danger',
  }

  const totalGasto = agendamentos
    .filter(a => a.status === 'concluido')
    .reduce((acc, a) => acc + Number(a.estudoEstetica_servico?.preco || 0), 0)

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    </DashboardLayout>
  )

  if (!cliente) return (
    <DashboardLayout>
      <div className="text-center py-16 text-gray-400">Cliente não encontrada</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/clientes" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para clientes
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {cliente.nome.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cliente.nome}</h1>
            <a href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
              className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {cliente.whatsapp}
            </a>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">Atendimentos</div>
          <div className="text-2xl font-bold text-gray-900">{agendamentos.filter(a => a.status === 'concluido').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">Total gasto</div>
          <div className="text-2xl font-bold text-primary-700">R$ {totalGasto.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">Cliente desde</div>
          <div className="text-xl font-bold text-gray-900">{new Date(cliente.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Pacotes */}
      {pacotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Pacotes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pacotes.map(pc => {
              const total = pc.estudoEstetica_pacote_definicao?.sessoes || 0
              const usadas = pc.sessoes_usadas
              const expirado = pc.data_expiracao && new Date(pc.data_expiracao) < new Date()
              return (
                <div key={pc.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{pc.estudoEstetica_pacote_definicao?.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{usadas}/{total} sessões</span>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.min((usadas/total)*100,100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <Badge variant={expirado ? 'danger' : usadas >= total ? 'default' : 'success'}>
                    {expirado ? 'Expirado' : usadas >= total ? 'Esgotado' : 'Ativo'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico de agendamentos */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Histórico de atendimentos</h2>
        </div>
        {agendamentos.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhum atendimento registrado</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Serviço</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Profissional</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agendamentos.map(ag => (
                <tr key={ag.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {new Date(ag.data + 'T12:00:00').toLocaleDateString('pt-BR')} {ag.horario?.slice(0,5)}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{ag.estudoEstetica_servico?.nome}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{ag.estudoEstetica_profissional?.nome}</td>
                  <td className="px-5 py-3"><Badge variant={STATUS_BADGE[ag.status]}>{ag.status}</Badge></td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                    R$ {Number(ag.estudoEstetica_servico?.preco || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
