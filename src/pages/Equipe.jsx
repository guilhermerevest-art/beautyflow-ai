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
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function Equipe() {
  const { studio } = useAuth()
  const [profissionais, setProfissionais] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('estudoEstetica_profissional')
        .select('*')
        .eq('studio_id', studio.id)
        .order('role')
      if (error) throw error
      setProfissionais(data || [])
    } catch (err) {
      toast.error('Não foi possível carregar a equipe. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (studio) load() }, [studio])

  const onSubmit = async ({ nome, email, senha }) => {
    try {
      // signUp funciona no frontend com anon key
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Não foi possível criar o acesso.')

      // Cria profissional vinculado
      const { error: profError } = await supabase.from('estudoEstetica_profissional').insert({
        studio_id: studio.id,
        user_id: authData.user.id,
        nome,
        role: 'ajudante',
      })
      if (profError) throw profError

      toast.success('Ajudante cadastrada! Ela receberá um e-mail para confirmar o acesso.')
      setModalOpen(false)
      reset()
      load()
    } catch (err) {
      if (err.message?.includes('already registered')) {
        toast.error('Este e-mail já está cadastrado. Use outro endereço.')
      } else {
        toast.error('Não conseguimos cadastrar a ajudante. Tente novamente.')
      }
      console.error(err)
    }
  }

  const toggleAtivo = async (p) => {
    try {
      const { error } = await supabase
        .from('estudoEstetica_profissional')
        .update({ ativo: !p.ativo })
        .eq('id', p.id)
      if (error) throw error
      toast.success(p.ativo ? 'Ajudante desativada' : 'Ajudante ativada')
      load()
    } catch (err) {
      toast.error('Não foi possível atualizar o status da ajudante. Tente novamente.')
      console.error(err)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie as profissionais do seu estúdio</p>
        </div>
        <Button onClick={() => { reset(); setModalOpen(true) }}>+ Nova ajudante</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {profissionais.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p className="font-medium">Nenhuma profissional cadastrada</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Função</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profissionais.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {p.nome.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={p.role === 'dona' ? 'primary' : 'default'}>
                        {p.role === 'dona' ? 'Dona' : 'Ajudante'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={p.ativo ? 'success' : 'default'}>{p.ativo ? 'Ativa' : 'Inativa'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {p.role !== 'dona' && (
                        <div className="flex justify-end">
                          <Button variant={p.ativo ? 'danger' : 'secondary'} onClick={() => toggleAtivo(p)}>
                            {p.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova ajudante">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Nome completo" placeholder="Ex: Maria Silva" error={errors.nome?.message} {...register('nome')} />
          <Input label="Email" type="email" placeholder="maria@email.com" error={errors.email?.message} {...register('email')} />
          <Input label="Senha inicial" type="password" placeholder="Mínimo 6 caracteres" error={errors.senha?.message} {...register('senha')} />
          <p className="text-xs text-gray-400">A ajudante terá acesso apenas à própria agenda.</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Cadastrando...' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
