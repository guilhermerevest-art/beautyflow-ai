import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'

const FORMA_LABEL = { dinheiro: '💵 Dinheiro', pix: '📱 Pix', cartao: '💳 Cartão' }

export default function Financeiro() {
  const { studio } = useAuth()
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0])
  const [pagamentos, setPagamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [relatorioPagamentos, setRelatorioPagamentos] = useState([])
  const [loadingRelatorio, setLoadingRelatorio] = useState(false)
  const [tab, setTab] = useState('caixa')

  useEffect(() => { if (studio) loadCaixa() }, [studio, data])

  const loadCaixa = async () => {
    setLoading(true)
    try {
      const { data: pags, error } = await supabase
        .from('estudoEstetica_pagamento')
        .select('*, estudoEstetica_agendamento(horario, estudoEstetica_cliente(nome), estudoEstetica_servico(nome))')
        .eq('studio_id', studio.id)
        .eq('data', data)
        .order('criado_em', { ascending: false })
      if (error) throw error
      setPagamentos(pags || [])
    } catch (err) {
      toast.error('Erro ao carregar caixa')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatorio = async () => {
    if (!periodoInicio || !periodoFim) { toast.error('Selecione o período'); return }
    setLoadingRelatorio(true)
    try {
      const { data: pags, error } = await supabase
        .from('estudoEstetica_pagamento')
        .select('valor, forma_pagamento, data')
        .eq('studio_id', studio.id)
        .gte('data', periodoInicio)
        .lte('data', periodoFim)
        .order('data')
      if (error) throw error
      setRelatorioPagamentos(pags || [])
    } catch (err) {
      toast.error('Erro ao gerar relatório')
      console.error(err)
    } finally {
      setLoadingRelatorio(false)
    }
  }

  const totalDia = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0)
  const totalDinheiro = pagamentos.filter(p => p.forma_pagamento === 'dinheiro').reduce((acc, p) => acc + Number(p.valor), 0)
  const totalPix = pagamentos.filter(p => p.forma_pagamento === 'pix').reduce((acc, p) => acc + Number(p.valor), 0)
  const totalCartao = pagamentos.filter(p => p.forma_pagamento === 'cartao').reduce((acc, p) => acc + Number(p.valor), 0)

  const relatorioTotal = relatorioPagamentos.reduce((acc, p) => acc + Number(p.valor), 0)
  const relatorioPorForma = {
    dinheiro: relatorioPagamentos.filter(p => p.forma_pagamento === 'dinheiro').reduce((acc, p) => acc + Number(p.valor), 0),
    pix: relatorioPagamentos.filter(p => p.forma_pagamento === 'pix').reduce((acc, p) => acc + Number(p.valor), 0),
    cartao: relatorioPagamentos.filter(p => p.forma_pagamento === 'cartao').reduce((acc, p) => acc + Number(p.valor), 0),
  }

  const exportarCSV = () => {
    const header = 'Data,Valor,Forma\n'
    const rows = relatorioPagamentos.map(p => `${p.data},${p.valor},${p.forma_pagamento}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${periodoInicio}_${periodoFim}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 text-sm mt-0.5">Controle de caixa e relatórios</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('caixa')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'caixa' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Caixa do dia
        </button>
        <button onClick={() => setTab('relatorio')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'relatorio' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Relatório por período
        </button>
      </div>

      {tab === 'caixa' && (
        <>
          <div className="mb-4">
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>

          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-sm text-gray-500 mb-1">Total do dia</div>
              <div className="text-2xl font-bold text-gray-900">R$ {totalDia.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-sm text-gray-500 mb-1">💵 Dinheiro</div>
              <div className="text-xl font-bold text-gray-900">R$ {totalDinheiro.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-sm text-gray-500 mb-1">📱 Pix</div>
              <div className="text-xl font-bold text-gray-900">R$ {totalPix.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-sm text-gray-500 mb-1">💳 Cartão</div>
              <div className="text-xl font-bold text-gray-900">R$ {totalCartao.toFixed(2)}</div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {pagamentos.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">💰</div>
                  <p className="font-medium">Nenhum pagamento neste dia</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Horário</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Serviço</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Forma</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagamentos.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-600">{p.estudoEstetica_agendamento?.horario?.slice(0,5)}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{p.estudoEstetica_agendamento?.estudoEstetica_cliente?.nome || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{p.estudoEstetica_agendamento?.estudoEstetica_servico?.nome || '—'}</td>
                        <td className="px-5 py-3 text-sm">{FORMA_LABEL[p.forma_pagamento]}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">R$ {Number(p.valor).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'relatorio' && (
        <>
          <div className="flex flex-wrap items-end gap-3 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Início</label>
              <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Fim</label>
              <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <button onClick={loadRelatorio} disabled={loadingRelatorio}
              className="gradient-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              {loadingRelatorio ? 'Gerando...' : 'Gerar relatório'}
            </button>
            {relatorioPagamentos.length > 0 && (
              <button onClick={exportarCSV}
                className="text-sm font-medium text-primary-600 hover:text-primary-800 px-4 py-2.5 rounded-full border border-primary-200 hover:bg-primary-50 transition-colors">
                Exportar CSV
              </button>
            )}
          </div>

          {relatorioPagamentos.length > 0 && (
            <>
              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">Total período</div>
                  <div className="text-2xl font-bold text-primary-700">R$ {relatorioTotal.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">💵 Dinheiro</div>
                  <div className="text-xl font-bold text-gray-900">R$ {relatorioPorForma.dinheiro.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">📱 Pix</div>
                  <div className="text-xl font-bold text-gray-900">R$ {relatorioPorForma.pix.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="text-sm text-gray-500 mb-1">💳 Cartão</div>
                  <div className="text-xl font-bold text-gray-900">R$ {relatorioPorForma.cartao.toFixed(2)}</div>
                </div>
              </div>

              {/* Barra visual */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Distribuição por forma</div>
                <div className="flex rounded-full overflow-hidden h-4">
                  {relatorioTotal > 0 && (
                    <>
                      <div className="bg-green-400" style={{ width: `${(relatorioPorForma.dinheiro / relatorioTotal) * 100}%` }} />
                      <div className="bg-blue-400" style={{ width: `${(relatorioPorForma.pix / relatorioTotal) * 100}%` }} />
                      <div className="bg-purple-400" style={{ width: `${(relatorioPorForma.cartao / relatorioTotal) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>Dinheiro</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Pix</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span>Cartão</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
