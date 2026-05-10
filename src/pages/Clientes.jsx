import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  whatsapp: z.string().min(10, 'WhatsApp inválido').max(20),
})

export default function Clientes() {
  const { studio } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busca, setBusca] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('estudoEstetica_cliente')
        .select('*')
        .eq('studio_id', studio.id)
        .order('nome')
      if (error) throw error
      setClientes(data)
    } catch (err) {
      toast.error('Erro ao carregar clientes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (studio) load() }, [studio])

  const openNew = () => { setEditing(null); reset({ nome: '', whatsapp: '' }); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); reset({ nome: c.nome, whatsapp: c.whatsapp }); setModalOpen(true) }

  const onSubmit = async (values) => {
    try {
      if (editing) {
        const { error } = await supabase.from('estudoEstetica_cliente').update(values).eq('id', editing.id)
        if (error) throw error
        toast.success('Cliente atualizado')
      } else {
        const { error } = await supabase.from('estudoEstetica_cliente').insert({ ...values, studio_id: studio.id })
        if (error) throw error
        toast.success('Cliente cadastrado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error('Erro ao salvar cliente')
      console.error(err)
    }
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca)
  )

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes.length} clientes cadastrados</p>
        </div>
        <Button onClick={openNew}>+ Nova cliente</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome ou WhatsApp..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p className="font-medium">{busca ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente cadastrada'}</p>
              {!busca && <p className="text-sm mt-1">Clique em "Nova cliente" para começar</p>}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cadastro</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.nome.charAt(0).toUpperCase()}
                        </div>
                        <Link to={`/clientes/${c.id}`} className="font-medium text-gray-900 hover:text-primary-700 transition-colors">
                          {c.nome}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <a
                        href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary-600 transition-colors"
                      >
                        {c.whatsapp}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm">
                      {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => openEdit(c)}>Editar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cliente' : 'Nova cliente'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome completo" placeholder="Ex: Ana Paula Silva" error={errors.nome?.message} {...register('nome')} />
          <Input label="WhatsApp" placeholder="(11) 99999-9999" error={errors.whatsapp?.message} {...register('whatsapp')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
