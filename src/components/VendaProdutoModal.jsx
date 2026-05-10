import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

export default function VendaProdutoModal({ open, onClose, onSaved }) {
  const { studio } = useAuth()
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [produtoId, setProdutoId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !studio) return
    setProdutoId(''); setClienteId(''); setQuantidade(1); setValor('')
    Promise.all([
      supabase.from('estudoEstetica_produto').select('id, nome, preco, estoque').eq('studio_id', studio.id).eq('ativo', true).order('nome'),
      supabase.from('estudoEstetica_cliente').select('id, nome').eq('studio_id', studio.id).order('nome'),
    ]).then(([p, c]) => {
      setProdutos(p.data || [])
      setClientes(c.data || [])
    })
  }, [open, studio])

  const onProdutoChange = (id) => {
    setProdutoId(id)
    const p = produtos.find(p => p.id === id)
    if (p) setValor((Number(p.preco) * quantidade).toFixed(2))
  }

  const onQtdChange = (q) => {
    setQuantidade(q)
    const p = produtos.find(p => p.id === produtoId)
    if (p) setValor((Number(p.preco) * q).toFixed(2))
  }

  const confirmar = async () => {
    if (!produtoId) { toast.error('Selecione um produto'); return }
    if (!valor || Number(valor) <= 0) { toast.error('Informe o valor'); return }
    const produto = produtos.find(p => p.id === produtoId)
    if (produto && produto.estoque < quantidade) { toast.error('Estoque insuficiente'); return }

    setLoading(true)
    try {
      const { error } = await supabase.from('estudoEstetica_produto_venda').insert({
        studio_id: studio.id,
        produto_id: produtoId,
        cliente_id: clienteId || null,
        quantidade: Number(quantidade),
        valor: Number(valor),
        tipo: 'venda_avulsa',
        data: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
      toast.success('Venda registrada')
      onSaved()
    } catch (err) {
      toast.error('Erro ao registrar venda')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Venda avulsa de produto">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Produto</label>
          <select value={produtoId} onChange={e => onProdutoChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
            <option value="">Selecione um produto</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — estoque: {p.estoque}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cliente (opcional)</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
            <option value="">Sem cliente vinculado</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Quantidade</label>
            <input type="number" min="1" value={quantidade} onChange={e => onQtdChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Valor (R$)</label>
            <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={confirmar} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Registrar venda'}</Button>
        </div>
      </div>
    </Modal>
  )
}
