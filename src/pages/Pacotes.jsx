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

const schemaPacote = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  sessoes: z.coerce.number().int().positive('Sessões inválidas'),
  preco: z.coerce.number().positive('Preço inválido'),
  validade_dias: z.coerce.number().int().positive('Validade inválida'),
})

export default function Pacotes() {
  const { studio } = useAuth()
  const [pacotes, setPacotes] = useState([])
  const [pacotesCliente, setPacotesCliente] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [vendaOpen, setVendaOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('definicoes')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schemaPacote),
  })

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: pacs }, { data: pcs }, { data: cls }] = await Promise.all([
        supabase.from('estudoEstetica_pacote_definicao').select('*').eq('studio_id', studio.id).order('nome'),
        supabase.from('estudoEstetica_pacote_cliente').select('*, estudoEstetica_pacote_definicao(nome, sessoes), estudoEstetica_cliente:cliente_id(nome, whatsapp)').order('data_compra', { ascending: false }),
        supabase.from('estudoEstetica_cliente').select('id, nome').eq('studio_id', studio.id).order('nome'),
      ])
      setPacotes(pacs || [])
      setPacotesCliente(pcs || [])
      setClientes(cls || [])
    } catch (err) {
      toast.error('Erro ao carregar pacotes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (studio) load() }, [studio])

  const openNew = () => { setEditing(null); reset({ nome: '', sessoes: '', preco: '', validade_dias: 180 }); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); reset({ nome: p.nome, sessoes: p.sessoes, preco: p.preco, validade_dias: p.validade_dias }); setModalOpen(true) }

  const onSubmit = async (values) => {
    try {
      if (editing) {
        const { error } = await supabase.from('estudoEstetica_pacote_definicao').update(values).eq('id', editing.id)
        if (error) throw error
        toast.success('Pacote atualizado')
      } else {
        const { error } = await supabase.from('estudoEstetica_pacote_definicao').insert({ ...values, studio_id: studio.id })
        if (error) throw error
        toast.success('Pacote criado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error('Erro ao salvar pacote')
      console.error(err)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacotes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie pacotes de sessões</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setVendaOpen(true)}>Vender pacote</Button>
          <Button onClick={openNew}>+ Novo pacote</Button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab('definicoes')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'definicoes' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}>
          Definições
        </button>
        <button onClick={() => setTab('vendidos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'vendidos' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}>
          Pacotes vendidos
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tab === 'definicoes' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {pacotes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">💼</div>
              <p className="font-medium">Nenhum pacote cadastrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pacote</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sessões</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Validade</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pacotes.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{p.nome}</td>
                    <td className="px-5 py-4 text-gray-600">{p.sessoes} sessões</td>
                    <td className="px-5 py-4 text-gray-600">R$ {Number(p.preco).toFixed(2)}</td>
                    <td className="px-5 py-4 text-gray-600">{p.validade_dias} dias</td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" onClick={() => openEdit(p)}>Editar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {pacotesCliente.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium">Nenhum pacote vendido ainda</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pacote</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sessões</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Compra</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pacotesCliente.map(pc => {
                  const total = pc.estudoEstetica_pacote_definicao?.sessoes || 0
                  const usadas = pc.sessoes_usadas
                  const expirado = pc.data_expiracao && new Date(pc.data_expiracao) < new Date()
                  return (
                    <tr key={pc.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">{pc.estudoEstetica_cliente?.nome}</td>
                      <td className="px-5 py-4 text-gray-600">{pc.estudoEstetica_pacote_definicao?.nome}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${usadas >= total ? 'text-red-600' : 'text-gray-900'}`}>{usadas}/{total}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.min((usadas / total) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{new Date(pc.data_compra).toLocaleDateString('pt-BR')}</td>
                      <td className="px-5 py-4">
                        {pc.data_expiracao ? (
                          <Badge variant={expirado ? 'danger' : 'success'}>
                            {expirado ? 'Expirado' : new Date(pc.data_expiracao).toLocaleDateString('pt-BR')}
                          </Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar pacote' : 'Novo pacote'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do pacote" placeholder="Ex: Pacote Limpeza 5x" error={errors.nome?.message} {...register('nome')} />
          <Input label="Quantidade de sessões" type="number" placeholder="5" error={errors.sessoes?.message} {...register('sessoes')} />
          <Input label="Preço (R$)" type="number" step="0.01" placeholder="0,00" error={errors.preco?.message} {...register('preco')} />
          <Input label="Validade (dias)" type="number" placeholder="180" error={errors.validade_dias?.message} {...register('validade_dias')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>

      <VenderPacoteModal
        open={vendaOpen}
        onClose={() => setVendaOpen(false)}
        onSaved={() => { setVendaOpen(false); load() }}
        pacotes={pacotes}
        clientes={clientes}
      />
    </DashboardLayout>
  )
}

function VenderPacoteModal({ open, onClose, onSaved, pacotes, clientes }) {
  const [pacoteId, setPacoteId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) { setPacoteId(''); setClienteId('') } }, [open])

  const confirmar = async () => {
    if (!pacoteId || !clienteId) { toast.error('Selecione pacote e cliente'); return }
    setLoading(true)
    try {
      const pacote = pacotes.find(p => p.id === pacoteId)
      const expiracao = new Date()
      expiracao.setDate(expiracao.getDate() + (pacote?.validade_dias || 180))

      const { error } = await supabase.from('estudoEstetica_pacote_cliente').insert({
        cliente_id: clienteId,
        pacote_id: pacoteId,
        data_compra: new Date().toISOString().split('T')[0],
        data_expiracao: expiracao.toISOString().split('T')[0],
      })
      if (error) throw error
      toast.success('Pacote vendido')
      onSaved()
    } catch (err) {
      toast.error('Erro ao vender pacote')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Vender pacote para cliente">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Pacote</label>
          <select value={pacoteId} onChange={e => setPacoteId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
            <option value="">Selecione um pacote</option>
            {pacotes.filter(p => p.ativo).map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {p.sessoes} sessões — R$ {Number(p.preco).toFixed(2)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cliente</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
            <option value="">Selecione uma cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={confirmar} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Vender pacote'}</Button>
        </div>
      </div>
    </Modal>
  )
}
