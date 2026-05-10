import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import PagamentoModal from './PagamentoModal'

const STATUS_LABEL = {
  agendado: { label: 'Agendado', variant: 'primary' },
  confirmado: { label: 'Confirmado', variant: 'success' },
  concluido: { label: 'Concluído', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
}

export default function AgendamentoDetalhe({ agendamento: ag, onClose, onUpdated }) {
  const { isDona } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pagamentoOpen, setPagamentoOpen] = useState(false)

  const updateStatus = async (status) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('estudoEstetica_agendamento')
        .update({ status })
        .eq('id', ag.id)
      if (error) throw error
      toast.success(`Agendamento ${STATUS_LABEL[status].label.toLowerCase()}`)
      onUpdated()
    } catch (err) {
      toast.error('Erro ao atualizar agendamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const cliente = ag.estudoEstetica_cliente
  const servico = ag.estudoEstetica_servico
  const whatsappLink = cliente?.whatsapp
    ? `https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${cliente.nome}! Confirmando seu agendamento de ${servico?.nome} em ${new Date(ag.data + 'T12:00:00').toLocaleDateString('pt-BR')} às ${ag.horario?.slice(0,5)}.`)}`
    : null

  return (
    <Modal open={true} onClose={onClose} title="Detalhes do agendamento">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={STATUS_LABEL[ag.status]?.variant}>{STATUS_LABEL[ag.status]?.label}</Badge>
          <span className="text-sm text-gray-500">
            {new Date(ag.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {ag.horario?.slice(0,5)}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cliente</span>
            <span className="font-medium text-gray-900">{cliente?.nome || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Serviço</span>
            <span className="font-medium text-gray-900">{servico?.nome || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Duração</span>
            <span className="font-medium text-gray-900">{servico?.duracao_min} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Valor</span>
            <span className="font-semibold text-primary-700">R$ {Number(servico?.preco || 0).toFixed(2)}</span>
          </div>
          {ag.observacao && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Obs.</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{ag.observacao}</span>
            </div>
          )}
        </div>

        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirmar via WhatsApp
          </a>
        )}

        {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
          <div className="flex gap-2">
            {ag.status === 'agendado' && (
              <Button variant="secondary" onClick={() => updateStatus('confirmado')} disabled={loading} className="flex-1">
                Confirmar
              </Button>
            )}
            {(ag.status === 'agendado' || ag.status === 'confirmado') && isDona && (
              <Button onClick={() => setPagamentoOpen(true)} disabled={loading} className="flex-1">
                Registrar pagamento
              </Button>
            )}
            <Button variant="danger" onClick={() => updateStatus('cancelado')} disabled={loading} className="flex-1">
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <PagamentoModal
        open={pagamentoOpen}
        onClose={() => setPagamentoOpen(false)}
        agendamento={ag}
        onSaved={() => { setPagamentoOpen(false); onUpdated() }}
      />
    </Modal>
  )
}
