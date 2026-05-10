import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function formatarMensagem(template: string, vars: Record<string, string>) {
  return template
    .replace('{nome}', vars.nome || '')
    .replace('{servico}', vars.servico || '')
    .replace('{data}', vars.data || '')
    .replace('{horario}', vars.horario || '')
}

async function enviarMensagem(url: string, instance: string, apiKey: string, numero: string, texto: string) {
  const numeroLimpo = '55' + numero.replace(/\D/g, '')
  const baseUrl = url.replace(/\/$/, '')
  const endpoint = `${baseUrl}/message/sendText/${instance}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({ number: numeroLimpo, text: texto }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro Evolution API: ${err}`)
  }

  return res.json()
}

Deno.serve(async (req) => {
  // Aceita chamadas GET (pg_cron via http) e POST (manual)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  const amanhaStr = amanha.toISOString().split('T')[0]

  const resultados: { studio: string; enviados: number; erros: number }[] = []

  try {
    // Busca todas as configurações com lembrete ativo
    const { data: configs, error: cfgErr } = await supabase
      .from('estudoEstetica_configuracao')
      .select('*')
      .eq('whatsapp_lembrete', true)
      .not('evolution_url', 'is', null)
      .not('evolution_instance', 'is', null)
      .not('evolution_key', 'is', null)

    if (cfgErr) throw cfgErr
    if (!configs?.length) {
      return new Response(JSON.stringify({ message: 'Nenhum studio com lembrete ativo', resultados }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    for (const cfg of configs) {
      let enviados = 0
      let erros = 0

      // Busca agendamentos de amanhã para este studio
      const { data: agendamentos, error: agErr } = await supabase
        .from('estudoEstetica_agendamento')
        .select(`
          id, data, horario, status,
          estudoEstetica_cliente:cliente_id(nome, whatsapp),
          estudoEstetica_servico:servico_id(nome)
        `)
        .eq('studio_id', cfg.studio_id)
        .eq('data', amanhaStr)
        .in('status', ['agendado', 'confirmado'])

      if (agErr) { console.error('Erro ao buscar agendamentos:', agErr); continue }
      if (!agendamentos?.length) continue

      for (const ag of agendamentos) {
        const cliente = ag.estudoEstetica_cliente as { nome: string; whatsapp: string } | null
        const servico = ag.estudoEstetica_servico as { nome: string } | null

        if (!cliente?.whatsapp) continue

        try {
          const texto = formatarMensagem(
            cfg.msg_lembrete || 'Olá {nome}! Lembrando que amanhã você tem {servico} às {horario}. Qualquer dúvida, é só chamar! 😊',
            {
              nome: cliente.nome,
              servico: servico?.nome || '',
              data: new Date(ag.data + 'T12:00:00').toLocaleDateString('pt-BR'),
              horario: ag.horario?.slice(0, 5),
            }
          )

          await enviarMensagem(cfg.evolution_url, cfg.evolution_instance, cfg.evolution_key, cliente.whatsapp, texto)
          enviados++
        } catch (err) {
          console.error(`Erro ao enviar lembrete para ${cliente.nome}:`, err)
          erros++
        }
      }

      resultados.push({ studio: cfg.studio_id, enviados, erros })
    }

    return new Response(JSON.stringify({ success: true, data: amanhaStr, resultados }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro geral:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
