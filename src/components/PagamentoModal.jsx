import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'

const FORMAS = [
  { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { value: 'pix', label: 'Pix', icon: '📱' },
  { value: 'cartao', label: 'Cartão', icon: '💳' },
]

export default function PagamentoModal({ open, onClose, agendamento, onSaved }) {
  const { studio } = useAuth()
  const [forma, setForma] = useState('pix')
  const [valor, setValor] = useState(agendamento?.estudoEstetica_servico?.preco || 0)
  const [loading, setLoading] = useState(false)

  const confirmar = async () => {
    if (!valor || valor <= 0) { toast.error('Informe o valor'); return }
    setLoading(true)
    try {
      const { error: errPag } = await supabase.from('estudoEstetica_pagamento').insert({
        agendamento_id: agendamento.id,
        studio_id: studio.id,
        valor: Number(valor),
        forma_pagamento: forma,
        data: agendamento.data,
      })
      if (errPag) throw errPag

      const { error: errAg } = await supabase
        .from('estudoEstetica_agendamento')
        .update({ status: 'concluido' })
        .eq('id', agendamento.id)
      if (errAg) throw errAg

      toast.success('Pagamento registrado')
      onSaved()
    } catch (err) {
      toast.error('Erro ao registrar pagamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar pagamento">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{agendamento?.estudoEstetica_cliente?.nome}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Serviço</span><span className="font-medium">{agendamento?.estudoEstetica_servico?.nome}</span></div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={e => setValor(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Forma de pagamento</label>
          <div className="grid grid-cols-3 gap-2">
            {FORMAS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setForma(f.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all
                  ${forma === f.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                <span className="text-xl">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={confirmar} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Confirmar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
