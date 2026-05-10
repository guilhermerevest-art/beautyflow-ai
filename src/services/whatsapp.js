import { supabase } from '../lib/supabase'

export async function getConfig(studioId) {
  const { data } = await supabase
    .from('estudoEstetica_configuracao')
    .select('*')
    .eq('studio_id', studioId)
    .single()
  return data
}

function formatarMensagem(template, vars) {
  return template
    .replace('{nome}', vars.nome || '')
    .replace('{servico}', vars.servico || '')
    .replace('{data}', vars.data || '')
    .replace('{horario}', vars.horario || '')
}

export async function enviarMensagem(config, numero, texto) {
  if (!config?.evolution_url || !config?.evolution_instance || !config?.evolution_key) {
    throw new Error('Evolution API não configurada. Configure em Configurações.')
  }

  const numeroLimpo = '55' + numero.replace(/\D/g, '')
  const baseUrl = config.evolution_url.replace(/\/$/, '')
  const url = `${baseUrl}/message/sendText/${config.evolution_instance}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.evolution_key,
    },
    body: JSON.stringify({
      number: numeroLimpo,
      text: texto,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro ao enviar mensagem: ${err}`)
  }

  return await res.json()
}

export async function enviarConfirmacao(config, agendamento) {
  const cliente = agendamento.estudoEstetica_cliente
  const servico = agendamento.estudoEstetica_servico
  if (!cliente?.whatsapp) throw new Error('Cliente sem WhatsApp cadastrado')

  const texto = formatarMensagem(
    config.msg_confirmacao || 'Olá {nome}! Seu agendamento de {servico} está confirmado para {data} às {horario}. Até lá! 💅',
    {
      nome: cliente.nome,
      servico: servico?.nome || '',
      data: new Date(agendamento.data + 'T12:00:00').toLocaleDateString('pt-BR'),
      horario: agendamento.horario?.slice(0, 5),
    }
  )

  return enviarMensagem(config, cliente.whatsapp, texto)
}

export async function enviarLembrete(config, agendamento) {
  const cliente = agendamento.estudoEstetica_cliente
  const servico = agendamento.estudoEstetica_servico
  if (!cliente?.whatsapp) throw new Error('Cliente sem WhatsApp cadastrado')

  const texto = formatarMensagem(
    config.msg_lembrete || 'Olá {nome}! Lembrando que amanhã você tem {servico} às {horario}. Qualquer dúvida, é só chamar! 😊',
    {
      nome: cliente.nome,
      servico: servico?.nome || '',
      data: new Date(agendamento.data + 'T12:00:00').toLocaleDateString('pt-BR'),
      horario: agendamento.horario?.slice(0, 5),
    }
  )

  return enviarMensagem(config, cliente.whatsapp, texto)
}

export async function enviarReativacao(config, cliente, mensagemCustom) {
  if (!cliente?.whatsapp) throw new Error('Cliente sem WhatsApp cadastrado')

  const texto = mensagemCustom || formatarMensagem(
    config.msg_reativacao || 'Olá {nome}! Sentimos sua falta! Que tal agendar um horário? 💕',
    { nome: cliente.nome }
  )

  return enviarMensagem(config, cliente.whatsapp, texto)
}
