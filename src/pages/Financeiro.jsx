import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

const FORMA_LABEL = { dinheiro: '💵 Dinheiro', pix: '📱 Pix', cartao: '💳 Cartão' }

export default function Financeiro() {
  const { studio } = useAuth()
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0])
  const [pagamentos, setPagamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [relatorioPagamentos, setRelatorioPagamentos] = useState([])
  const [relatorioDespesas, setRelatorioDespesas] = useState([])
  const [loadingRelatorio, setLoadingRelatorio] = useState(false)
  const [tab, setTab] = useState('caixa')

  // Saídas (despesas)
  const [despesas, setDespesas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loadingDespesas, setLoadingDespesas] = useState(false)
  const [modalDespesa, setModalDespesa] = useState(false)
  const [novaDespesa, setNovaDespesa] = useState({ descricao: '', valor: '', categoria_id: '', data: new Date().toISOString().split('T')[0] })
  const [novaCategoria, setNovaCategoria] = useState('')
  const [salvandoDespesa, setSalvandoDespesa] = useState(false)

  useEffect(() => { if (studio) loadCaixa() }, [studio, data])

  useEffect(() => {
    if (studio && tab === 'saidas') { loadDespesas(); loadCategorias() }
  }, [studio, tab])

  const loadCategorias = async () => {
    const { data: cats } = await supabase
      .from('estudoEstetica_categoria_despesa')
      .select('*')
      .eq('studio_id', studio.id)
      .order('nome')
    setCategorias(cats || [])
  }

  const loadDespesas = async () => {
    setLoadingDespesas(true)
    try {
      const { data: deps, error } = await supabase
        .from('estudoEstetica_despesa')
        .select('*, estudoEstetica_categoria_despesa(nome)')
        .eq('studio_id', studio.id)
        .order('data', { ascending: false })
        .limit(50)
      if (error) throw error
      setDespesas(deps || [])
    } catch (err) {
      toast.error('Não foi possível carregar as saídas.')
      console.error(err)
    } finally {
      setLoadingDespesas(false)
    }
  }

  const criarCategoria = async () => {
    if (!novaCategoria.trim()) return
    try {
      const { data: cat, error } = await supabase
        .from('estudoEstetica_categoria_despesa')
        .insert({ studio_id: studio.id, nome: novaCategoria.trim() })
        .select()
        .single()
      if (error) throw error
      setCategorias(prev => [...prev, cat].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovaDespesa(d => ({ ...d, categoria_id: cat.id }))
      setNovaCategoria('')
      toast.success('Categoria criada!')
    } catch (err) {
      toast.error('Não foi possível criar a categoria.')
      console.error(err)
    }
  }

  const salvarDespesa = async () => {
    if (!novaDespesa.descricao || !novaDespesa.valor) { toast.error('Preencha descrição e valor'); return }
    setSalvandoDespesa(true)
    try {
      const { error } = await supabase.from('estudoEstetica_despesa').insert({
        studio_id: studio.id,
        descricao: novaDespesa.descricao,
        valor: Number(novaDespesa.valor),
        categoria_id: novaDespesa.categoria_id || null,
        data: novaDespesa.data,
      })
      if (error) throw error
      toast.success('Saída registrada!')
      setModalDespesa(false)
      setNovaDespesa({ descricao: '', valor: '', categoria_id: '', data: new Date().toISOString().split('T')[0] })
      loadDespesas()
    } catch (err) {
      toast.error('Não foi possível registrar a saída.')
      console.error(err)
    } finally {
      setSalvandoDespesa(false)
    }
  }

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
      toast.error('Não foi possível carregar o caixa. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRelatorio = async () => {
    if (!periodoInicio || !periodoFim) { toast.error('Selecione a data de início e fim do período'); return }
    setLoadingRelatorio(true)
    try {
      const [{ data: pags, error }, { data: deps, error: errDeps }] = await Promise.all([
        supabase
          .from('estudoEstetica_pagamento')
          .select('valor, forma_pagamento, data')
          .eq('studio_id', studio.id)
          .gte('data', periodoInicio)
          .lte('data', periodoFim)
          .order('data'),
        supabase
          .from('estudoEstetica_despesa')
          .select('valor, data')
          .eq('studio_id', studio.id)
          .gte('data', periodoInicio)
          .lte('data', periodoFim)
          .order('data'),
      ])
      if (error) throw error
      if (errDeps) throw errDeps
      setRelatorioPagamentos(pags || [])
      setRelatorioDespesas(deps || [])
    } catch (err) {
      toast.error('Não foi possível gerar o relatório. Tente novamente.')
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        <button onClick={() => setTab('caixa')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === 'caixa' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Caixa do dia
        </button>
        <button onClick={() => setTab('saidas')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === 'saidas' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Saídas
        </button>
        <button onClick={() => setTab('relatorio')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === 'relatorio' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Relatório
        </button>
      </div>

      {tab === 'caixa' && (
        <>
          <div className="mb-4">
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
          ) : pagamentos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">💰</div>
              <p className="font-medium">Nenhum pagamento neste dia</p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="lg:hidden space-y-2">
                {pagamentos.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-12 flex-shrink-0">{p.estudoEstetica_agendamento?.horario?.slice(0,5)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.estudoEstetica_agendamento?.estudoEstetica_cliente?.nome || '—'}</p>
                      <p className="text-xs text-gray-400 truncate">{p.estudoEstetica_agendamento?.estudoEstetica_servico?.nome || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">R$ {Number(p.valor).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{FORMA_LABEL[p.forma_pagamento]}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
              </div>
            </>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

              {/* Gráfico receita vs despesa por semana */}
              <GraficoSemanal receitas={relatorioPagamentos} despesas={relatorioDespesas} />
            </>
          )}
        </>
      )}

      {/* Aba Saídas */}
      {tab === 'saidas' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{despesas.length} saídas registradas</p>
            <Button onClick={() => setModalDespesa(true)}>+ Nova saída</Button>
          </div>

          {loadingDespesas ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : despesas.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">📤</div>
              <p className="font-medium">Nenhuma saída registrada</p>
              <p className="text-sm mt-1">Registre compras de produtos, materiais e despesas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {despesas.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg flex-shrink-0">📤</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{d.descricao}</p>
                    <p className="text-xs text-gray-400">
                      {d.estudoEstetica_categoria_despesa?.nome || 'Sem categoria'} · {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="font-bold text-red-600 text-sm flex-shrink-0">- R$ {Number(d.valor).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Nova Saída */}
      <Modal open={modalDespesa} onClose={() => setModalDespesa(false)} title="Registrar saída">
        <div className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Compra de creme hidratante"
            value={novaDespesa.descricao}
            onChange={e => setNovaDespesa(d => ({ ...d, descricao: e.target.value }))}
          />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={novaDespesa.valor}
            onChange={e => setNovaDespesa(d => ({ ...d, valor: e.target.value }))}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Categoria</label>
            <select
              value={novaDespesa.categoria_id}
              onChange={e => setNovaDespesa(d => ({ ...d, categoria_id: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {/* Cadastro rápido de categoria */}
            <div className="flex gap-2 mt-2">
              <input
                placeholder="Nova categoria..."
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                type="button"
                onClick={criarCategoria}
                className="px-3 py-2 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                + Criar
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Data</label>
            <input
              type="date"
              value={novaDespesa.data}
              onChange={e => setNovaDespesa(d => ({ ...d, data: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalDespesa(false)} className="flex-1">Cancelar</Button>
            <Button onClick={salvarDespesa} disabled={salvandoDespesa} className="flex-1">
              {salvandoDespesa ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function GraficoSemanal({ receitas, despesas }) {
  const agruparPorSemana = (items) => {
    const semanas = {}
    items.forEach(item => {
      const d = new Date(item.data + 'T12:00:00')
      const inicio = new Date(d)
      inicio.setDate(d.getDate() - d.getDay() + 1)
      const key = inicio.toISOString().split('T')[0]
      semanas[key] = (semanas[key] || 0) + Number(item.valor)
    })
    return semanas
  }

  const recSemanas = agruparPorSemana(receitas)
  const despSemanas = agruparPorSemana(despesas)
  const todasSemanas = [...new Set([...Object.keys(recSemanas), ...Object.keys(despSemanas)])].sort()

  if (todasSemanas.length === 0) return null

  const dados = todasSemanas.map(s => ({
    semana: s,
    receita: recSemanas[s] || 0,
    despesa: despSemanas[s] || 0,
  }))

  const maxVal = Math.max(...dados.map(d => Math.max(d.receita, d.despesa)), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div className="text-sm font-medium text-gray-700 mb-4">Receita vs Despesa por semana</div>
      <div className="flex items-end gap-2 h-32 overflow-x-auto">
        {dados.map(d => (
          <div key={d.semana} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]">
            <div className="flex items-end gap-0.5 h-24 w-full justify-center">
              <div
                className="w-3 bg-green-400 rounded-t"
                style={{ height: `${(d.receita / maxVal) * 100}%`, minHeight: d.receita > 0 ? '4px' : '0' }}
                title={`R$ ${d.receita.toFixed(0)}`}
              />
              <div
                className="w-3 bg-red-400 rounded-t"
                style={{ height: `${(d.despesa / maxVal) * 100}%`, minHeight: d.despesa > 0 ? '4px' : '0' }}
                title={`R$ ${d.despesa.toFixed(0)}`}
              />
            </div>
            <span className="text-[9px] text-gray-400 whitespace-nowrap">
              {new Date(d.semana + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>Receita</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>Despesa</span>
      </div>
    </div>
  )
}
