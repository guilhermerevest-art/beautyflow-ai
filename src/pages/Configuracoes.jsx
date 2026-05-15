import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { enviarMensagem } from '../services/whatsapp'

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
          ${checked ? 'gradient-primary' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function Configuracoes() {
  const { studio } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState({
    evolution_url: '',
    evolution_instance: '',
    evolution_key: '',
    whatsapp_confirmacao: false,
    whatsapp_lembrete: false,
    whatsapp_reativacao: false,
    msg_confirmacao: 'Olá {nome}! Seu agendamento de {servico} está confirmado para {data} às {horario}. Até lá! 💅',
    msg_lembrete: 'Olá {nome}! Lembrando que amanhã você tem {servico} às {horario}. Qualquer dúvida, é só chamar! 😊',
    msg_reativacao: 'Olá {nome}! Sentimos sua falta! Que tal agendar um horário? Temos novidades esperando por você 💕',
  })
  const [numeroTeste, setNumeroTeste] = useState('')

  useEffect(() => {
    if (!studio) return
    loadConfig()
  }, [studio])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('estudoEstetica_configuracao')
        .select('*')
        .eq('studio_id', studio.id)
        .single()
      if (data) setConfig(c => ({ ...c, ...data }))
    } catch {
      // sem config ainda, usa defaults
    } finally {
      setLoading(false)
    }
  }

  const salvar = async () => {
    setSaving(true)
    try {
      const payload = {
        studio_id: studio.id,
        evolution_url: config.evolution_url,
        evolution_instance: config.evolution_instance,
        evolution_key: config.evolution_key,
        whatsapp_confirmacao: config.whatsapp_confirmacao,
        whatsapp_lembrete: config.whatsapp_lembrete,
        whatsapp_reativacao: config.whatsapp_reativacao,
        msg_confirmacao: config.msg_confirmacao,
        msg_lembrete: config.msg_lembrete,
        msg_reativacao: config.msg_reativacao,
        atualizado_em: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('estudoEstetica_configuracao')
        .upsert(payload, { onConflict: 'studio_id' })

      if (error) throw error
      toast.success('Configurações salvas!')
    } catch (err) {
      toast.error('Não foi possível salvar. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const testarConexao = async () => {
    if (!numeroTeste) { toast.error('Informe um número para teste'); return }
    setTesting(true)
    try {
      await enviarMensagem(config, numeroTeste, '✅ Teste de conexão Meu Salão — funcionando!')
      toast.success('Mensagem enviada! Verifique o WhatsApp.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTesting(false)
    }
  }

  const set = (key, value) => setConfig(c => ({ ...c, [key]: value }))

  if (loading) return <DashboardLayout><div className="flex justify-center py-16"><Spinner size="lg" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Integração WhatsApp via Evolution API</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Credenciais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Evolution API</h2>
          <p className="text-xs text-gray-400 mb-4">Configure a URL, instância e chave da sua API</p>
          <div className="space-y-4">
            <Input
              label="URL da API"
              placeholder="https://sua-api.com"
              value={config.evolution_url}
              onChange={e => set('evolution_url', e.target.value)}
            />
            <Input
              label="Nome da instância"
              placeholder="minha-instancia"
              value={config.evolution_instance}
              onChange={e => set('evolution_instance', e.target.value)}
            />
            <Input
              label="API Key"
              type="password"
              placeholder="sua-chave-secreta"
              value={config.evolution_key}
              onChange={e => set('evolution_key', e.target.value)}
            />
          </div>

          {/* Teste de conexão */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Testar conexão</p>
            <div className="flex gap-2">
              <Input
                placeholder="(11) 99999-9999"
                value={numeroTeste}
                onChange={e => setNumeroTeste(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" onClick={testarConexao} disabled={testing}>
                {testing ? 'Enviando...' : 'Testar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Automações */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Mensagens automáticas</h2>
          <p className="text-xs text-gray-400 mb-4">Ative para enviar mensagens automaticamente nos eventos abaixo</p>
          <div className="divide-y divide-gray-50">
            <Toggle
              label="Confirmação de agendamento"
              description="Enviada ao criar ou confirmar um agendamento"
              checked={config.whatsapp_confirmacao}
              onChange={v => set('whatsapp_confirmacao', v)}
            />
            <Toggle
              label="Lembrete 24h antes"
              description="Enviada um dia antes do agendamento"
              checked={config.whatsapp_lembrete}
              onChange={v => set('whatsapp_lembrete', v)}
            />
            <Toggle
              label="Reativação de clientes"
              description="Usada na página de IA Reativação"
              checked={config.whatsapp_reativacao}
              onChange={v => set('whatsapp_reativacao', v)}
            />
          </div>
        </div>

        {/* Templates de mensagem */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Templates de mensagem</h2>
          <p className="text-xs text-gray-400 mb-4">
            Use <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{servico}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{data}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{horario}'}</code> como variáveis
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirmação</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                value={config.msg_confirmacao}
                onChange={e => set('msg_confirmacao', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Lembrete</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                value={config.msg_lembrete}
                onChange={e => set('msg_lembrete', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Reativação</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                value={config.msg_reativacao}
                onChange={e => set('msg_reativacao', e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button onClick={salvar} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </div>
    </DashboardLayout>
  )
}
