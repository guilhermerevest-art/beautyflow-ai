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
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { maskWhatsApp } from '../utils/masks'

const schema = z.object({
  nome: z.string().min(1, 'Informe o nome da cliente').min(2, 'O nome precisa ter pelo menos 2 letras'),
  whatsapp: z.string().min(1, 'Informe o WhatsApp da cliente').min(10, 'WhatsApp inválido. Ex: (11) 99999-9999').max(20),
  data_nascimento: z.string().optional(),
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
      const [{ data: cls, error }, { data: ultimosAgs }] = await Promise.all([
        supabase
          .from('estudoEstetica_cliente')
          .select('*')
          .eq('studio_id', studio.id)
          .order('nome'),
        supabase
          .from('estudoEstetica_agendamento')
          .select('cliente_id, data')
          .eq('studio_id', studio.id)
          .neq('status', 'cancelado')
          .order('data', { ascending: false }),
      ])
      if (error) throw error
      const ultimaVisita = {}
      ;(ultimosAgs || []).forEach(a => {
        if (!ultimaVisita[a.cliente_id]) ultimaVisita[a.cliente_id] = a.data
      })
      const hoje = new Date()
      const clientesComStatus = (cls || []).map(c => {
        const ultima = ultimaVisita[c.id]
        let inativa = false
        if (ultima) {
          const diff = (hoje - new Date(ultima + 'T12:00:00')) / (1000 * 60 * 60 * 24)
          inativa = diff > 30
        }
        return { ...c, inativa }
      })
      setClientes(clientesComStatus)
    } catch (err) {
      toast.error('Não foi possível carregar as clientes. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (studio) load() }, [studio])

  const openNew = () => { setEditing(null); reset({ nome: '', whatsapp: '', data_nascimento: '' }); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); reset({ nome: c.nome, whatsapp: c.whatsapp, data_nascimento: c.data_nascimento || '' }); setModalOpen(true) }

  const onSubmit = async (values) => {
    const payload = { nome: values.nome, whatsapp: values.whatsapp, data_nascimento: values.data_nascimento || null }
    try {
      if (editing) {
        const { error } = await supabase.from('estudoEstetica_cliente').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Cliente atualizado')
      } else {
        const { error } = await supabase.from('estudoEstetica_cliente').insert({ ...payload, studio_id: studio.id })
        if (error) throw error
        toast.success('Cliente cadastrado')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error('Não foi possível salvar os dados da cliente. Tente novamente.')
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
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium">{busca ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente cadastrada'}</p>
          {!busca && <p className="text-sm mt-1">Clique em "Nova cliente" para começar</p>}
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="lg:hidden space-y-2">
            {filtrados.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{c.nome}</p>
                      {c.inativa && <Badge variant="danger">30d+</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <button onClick={() => openEdit(c)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Editar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                      <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors">
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
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cliente' : 'Nova cliente'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome completo" placeholder="Ex: Ana Paula Silva" error={errors.nome?.message} {...register('nome')} />
          <Input label="WhatsApp" placeholder="(11) 99999-9999" error={errors.whatsapp?.message} {...register('whatsapp', { onChange: (e) => { e.target.value = maskWhatsApp(e.target.value) } })} />
          <Input label="Data de nascimento (opcional)" type="date" {...register('data_nascimento')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
