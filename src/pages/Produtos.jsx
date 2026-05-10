import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import VendaProdutoModal from '../components/VendaProdutoModal'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  preco: z.coerce.number().min(0, 'Preço inválido'),
  estoque: z.coerce.number().int().min(0, 'Estoque inválido'),
  estoque_minimo: z.coerce.number().int().min(0, 'Mínimo inválido'),
})

export default function Produtos() {
  const { studio } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [vendaOpen, setVendaOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('estoque')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('estudoEstetica_produto')
        .select('*')
        .eq('studio_id', studio.id)
        .order('nome')
      if (error) throw error
      setProdutos(data || [])
    } catch (err) {
      toast.error('Erro ao carregar produtos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (studio) load() }, [studio])

  const openNew = () => { setEditing(null); reset({ nome: '', preco: '', estoque: 0, estoque_minimo: 5 }); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); reset({ nome: p.nome, preco: p.preco, estoque: p.estoque, estoque_minimo: p.estoque_minimo }); setModalOpen(true) }

  const onSubmit = async (values) => {
    try {
      if (editing) {
        const { error } = await supabase.from('estudoEstetica_produto').update(values).eq('id', editing.id)
        if (error) throw error
        toast.success('Produto atualizado')
      } else {
        const { error } = await supabase.from('estudoEstetica_produto').insert({ ...values, studio_id: studio.id })
        if (error) throw error
        toast.success('Produto cadastrado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error('Erro ao salvar produto')
      console.error(err)
    }
  }

  const toggleAtivo = async (p) => {
    try {
      const { error } = await supabase.from('estudoEstetica_produto').update({ ativo: !p.ativo }).eq('id', p.id)
      if (error) throw error
      toast.success(p.ativo ? 'Produto desativado' : 'Produto ativado')
      load()
    } catch (err) {
      toast.error('Erro ao atualizar produto')
      console.error(err)
    }
  }

  const alertas = produtos.filter(p => p.ativo && p.estoque <= p.estoque_minimo)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{produtos.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setVendaOpen(true)}>Venda avulsa</Button>
          <Button onClick={openNew}>+ Novo produto</Button>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Estoque baixo em {alertas.length} produto(s)</p>
            <p className="text-amber-600 text-xs mt-0.5">{alertas.map(p => p.nome).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('estoque')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'estoque' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Estoque
        </button>
        <button onClick={() => setTab('movimentacao')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'movimentacao' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Movimentação
        </button>
      </div>

      {tab === 'estoque' && (
        loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {produtos.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-medium">Nenhum produto cadastrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {produtos.map(p => {
                    const baixo = p.ativo && p.estoque <= p.estoque_minimo
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900">{p.nome}</td>
                        <td className="px-5 py-4 text-gray-600">R$ {Number(p.preco).toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${baixo ? 'text-amber-600' : 'text-gray-900'}`}>{p.estoque}</span>
                            {baixo && <span className="text-amber-500 text-xs">⚠️ mín. {p.estoque_minimo}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={p.ativo ? 'success' : 'default'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="ghost" onClick={() => openEdit(p)}>Editar</Button>
                            <Button variant={p.ativo ? 'danger' : 'secondary'} onClick={() => toggleAtivo(p)}>
                              {p.ativo ? 'Desativar' : 'Ativar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {tab === 'movimentacao' && (
        <MovimentacaoProdutos studioId={studio?.id} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar produto' : 'Novo produto'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do produto" placeholder="Ex: Creme hidratante" error={errors.nome?.message} {...register('nome')} />
          <Input label="Preço (R$)" type="number" step="0.01" placeholder="0,00" error={errors.preco?.message} {...register('preco')} />
          <Input label="Estoque inicial" type="number" placeholder="0" error={errors.estoque?.message} {...register('estoque')} />
          <Input label="Estoque mínimo (alerta)" type="number" placeholder="5" error={errors.estoque_minimo?.message} {...register('estoque_minimo')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>

      <VendaProdutoModal
        open={vendaOpen}
        onClose={() => setVendaOpen(false)}
        onSaved={() => { setVendaOpen(false); load() }}
      />
    </DashboardLayout>
  )
}

function MovimentacaoProdutos({ studioId }) {
  const [movs, setMovs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studioId) return
    supabase
      .from('estudoEstetica_produto_venda')
      .select('*, estudoEstetica_produto(nome), estudoEstetica_cliente(nome)')
      .eq('studio_id', studioId)
      .order('criado_em', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error) setMovs(data || [])
        setLoading(false)
      })
  }, [studioId])

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {movs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">Nenhuma movimentação registrada</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Qtd</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {movs.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm text-gray-500">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">{m.estudoEstetica_produto?.nome}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.estudoEstetica_cliente?.nome || '—'}</td>
                <td className="px-5 py-3">
                  <Badge variant={m.tipo === 'venda_avulsa' ? 'primary' : 'default'}>
                    {m.tipo === 'venda_avulsa' ? 'Venda' : 'Uso'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.quantidade}</td>
                <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">R$ {Number(m.valor).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
