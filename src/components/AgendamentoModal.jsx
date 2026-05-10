import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

const schema = z.object({
  cliente_id: z.string().min(1, 'Selecione uma cliente'),
  servico_id: z.string().min(1, 'Selecione um serviço'),
  profissional_id: z.string().min(1, 'Selecione um profissional'),
  data: z.string().min(1, 'Informe a data'),
  horario: z.string().min(1, 'Selecione um horário'),
  observacao: z.string().optional(),
})

const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

export default function AgendamentoModal({ open, onClose, onSaved, profissionalId, slotInicial }) {
  const { studio, isDona } = useAuth()
  const [clientes, setClientes] = useState([])
  const [servicos, setServicos] = useState([])
  const [profissionais, setProfissionais] = useState([])
  const [horariosOcupados, setHorariosOcupados] = useState([])

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      profissional_id: profissionalId || '',
      data: slotInicial?.data || '',
      horario: slotInicial?.horario || '',
    }
  })

  const dataSelecionada = watch('data')
  const profSelecionado = watch('profissional_id')

  useEffect(() => {
    if (!open || !studio) return
    reset({
      cliente_id: '',
      servico_id: '',
      profissional_id: profissionalId || '',
      data: slotInicial?.data || '',
      horario: slotInicial?.horario || '',
      observacao: '',
    })
    Promise.all([
      supabase.from('estudoEstetica_cliente').select('id, nome').eq('studio_id', studio.id).order('nome'),
      supabase.from('estudoEstetica_servico').select('id, nome, preco, duracao_min').eq('studio_id', studio.id).eq('ativo', true).order('nome'),
      supabase.from('estudoEstetica_profissional').select('id, nome').eq('studio_id', studio.id).eq('ativo', true),
    ]).then(([c, s, p]) => {
      setClientes(c.data || [])
      setServicos(s.data || [])
      setProfissionais(p.data || [])
    })
  }, [open, studio])

  useEffect(() => {
    if (!dataSelecionada || !profSelecionado) return
    supabase
      .from('estudoEstetica_agendamento')
      .select('horario')
      .eq('profissional_id', profSelecionado)
      .eq('data', dataSelecionada)
      .neq('status', 'cancelado')
      .then(({ data }) => setHorariosOcupados((data || []).map(a => a.horario.slice(0, 5))))
  }, [dataSelecionada, profSelecionado])

  const onSubmit = async (values) => {
    try {
      const { error } = await supabase.from('estudoEstetica_agendamento').insert({
        studio_id: studio.id,
        profissional_id: values.profissional_id,
        servico_id: values.servico_id,
        cliente_id: values.cliente_id,
        data: values.data,
        horario: values.horario,
        observacao: values.observacao || null,
        status: 'agendado',
      })
      if (error) throw error
      toast.success('Agendamento criado com sucesso!')
      onSaved()
    } catch (err) {
      toast.error('Não foi possível criar o agendamento. Tente novamente.')
      console.error(err)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cliente</label>
          <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" {...register('cliente_id')}>
            <option value="">Selecione uma cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {errors.cliente_id && <span className="text-xs text-red-500">{errors.cliente_id.message}</span>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Serviço</label>
          <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" {...register('servico_id')}>
            <option value="">Selecione um serviço</option>
            {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} — R$ {Number(s.preco).toFixed(2)} ({s.duracao_min}min)</option>)}
          </select>
          {errors.servico_id && <span className="text-xs text-red-500">{errors.servico_id.message}</span>}
        </div>

        {isDona && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Profissional</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" {...register('profissional_id')}>
              <option value="">Selecione</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            {errors.profissional_id && <span className="text-xs text-red-500">{errors.profissional_id.message}</span>}
          </div>
        )}

        <Input label="Data" type="date" error={errors.data?.message} {...register('data')} />

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Horário</label>
          <div className="grid grid-cols-7 gap-1">
            {HORARIOS.map(h => {
              const ocupado = horariosOcupados.includes(h)
              return (
                <button
                  key={h}
                  type="button"
                  disabled={ocupado}
                  onClick={() => setValue('horario', h)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition-colors
                    ${watch('horario') === h ? 'gradient-primary text-white' :
                      ocupado ? 'bg-gray-100 text-gray-300 cursor-not-allowed' :
                      'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-700'}`}
                >
                  {h}
                </button>
              )
            })}
          </div>
          {errors.horario && <span className="text-xs text-red-500 mt-1 block">{errors.horario.message}</span>}
        </div>

        <Input label="Observação (opcional)" placeholder="Ex: cliente prefere produto X" {...register('observacao')} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Salvando...' : 'Agendar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
