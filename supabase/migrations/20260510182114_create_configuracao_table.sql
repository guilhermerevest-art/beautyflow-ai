create table "estudoEstetica_configuracao" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null unique references "estudoEstetica_studio"(id) on delete cascade,
  evolution_url text,
  evolution_instance text,
  evolution_key text,
  whatsapp_confirmacao boolean default false,
  whatsapp_lembrete boolean default false,
  whatsapp_reativacao boolean default false,
  msg_confirmacao text default 'Olá {nome}! Seu agendamento de {servico} está confirmado para {data} às {horario}. Até lá! 💅',
  msg_lembrete text default 'Olá {nome}! Lembrando que amanhã você tem {servico} às {horario}. Qualquer dúvida, é só chamar! 😊',
  msg_reativacao text default 'Olá {nome}! Sentimos sua falta! Que tal agendar um horário? Temos novidades esperando por você 💕',
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table "estudoEstetica_configuracao" enable row level security;

create policy "configuracao: dona acessa proprio studio"
  on "estudoEstetica_configuracao" for all
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );
