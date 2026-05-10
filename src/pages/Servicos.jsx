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

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  preco: z.coerce.number().positive('Preço inválido'),
  duracao_min: z.coerce.number().int().positive('Duração inválida'),
})

export default function Servicos() {
  const { studio } = useAuth()
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('estudoEstetica_servico')
        .select('*')
        .eq('studio_id', studio.id)
        .order('nome')
      if (error) throw error
      setServicos(data)
    } catch (err) {
      toast.error('Erro ao carregar serviços')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (studio) load() }, [studio])

  const openNew = () => { setEditing(null); reset({ nome: '', preco: '', duracao_min: '' }); setModalOpen(true) }
  const openEdit = (s) => { setEditing(s); reset({ nome: s.nome, preco: s.preco, duracao_min: s.duracao_min }); setModalOpen(true) }

  const onSubmit = async (values) => {
    try {
      if (editing) {
        const { error } = await supabase.from('estudoEstetica_servico').update(values).eq('id', editing.id)
        if (error) throw error
        toast.success('Serviço atualizado')
      } else {
        const { error } = await supabase.from('estudoEstetica_servico').insert({ ...values, studio_id: studio.id })
        if (error) throw error
        toast.success('Serviço criado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error('Erro ao salvar serviço')
      console.error(err)
    }
  }

  const toggleAtivo = async (s) => {
    try {
      const { error } = await supabase.from('estudoEstetica_servico').update({ ativo: !s.ativo }).eq('id', s.id)
      if (error) throw error
      toast.success(s.ativo ? 'Serviço desativado' : 'Serviço ativado')
      load()
    } catch (err) {
      toast.error('Erro ao atualizar serviço')
      console.error(err)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie os serviços do seu estúdio</p>
        </div>
        <Button onClick={openNew}>+ Novo serviço</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {servicos.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">✂️</div>
              <p className="font-medium">Nenhum serviço cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo serviço" para começar</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duração</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {servicos.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{s.nome}</td>
                    <td className="px-5 py-4 text-gray-600">R$ {Number(s.preco).toFixed(2)}</td>
                    <td className="px-5 py-4 text-gray-600">{s.duracao_min} min</td>
                    <td className="px-5 py-4">
                      <Badge variant={s.ativo ? 'success' : 'default'}>{s.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" onClick={() => openEdit(s)}>Editar</Button>
                        <Button variant={s.ativo ? 'danger' : 'secondary'} onClick={() => toggleAtivo(s)}>
                          {s.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar serviço' : 'Novo serviço'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do serviço" placeholder="Ex: Limpeza de Pele" error={errors.nome?.message} {...register('nome')} />
          <Input label="Preço (R$)" type="number" step="0.01" placeholder="0,00" error={errors.preco?.message} {...register('preco')} />
          <Input label="Duração (minutos)" type="number" placeholder="60" error={errors.duracao_min?.message} {...register('duracao_min')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
