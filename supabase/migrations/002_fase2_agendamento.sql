-- Agendamento
create table "estudoEstetica_agendamento" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  profissional_id uuid not null references "estudoEstetica_profissional"(id),
  servico_id uuid not null references "estudoEstetica_servico"(id),
  cliente_id uuid references "estudoEstetica_cliente"(id) on delete set null,
  data date not null,
  horario time not null,
  status text not null default 'agendado' check (status in ('agendado','confirmado','concluido','cancelado')),
  observacao text,
  criado_em timestamptz default now()
);

create index idx_agendamento_profissional_data on "estudoEstetica_agendamento"(profissional_id, data);
create index idx_agendamento_studio_data on "estudoEstetica_agendamento"(studio_id, data);

alter table "estudoEstetica_agendamento" enable row level security;

create policy "agendamento: dona ve todos do studio"
  on "estudoEstetica_agendamento" for select
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );

create policy "agendamento: ajudante ve proprios"
  on "estudoEstetica_agendamento" for select
  using (
    profissional_id = (select id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

create policy "agendamento: profissional insere"
  on "estudoEstetica_agendamento" for insert
  with check (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

create policy "agendamento: profissional atualiza"
  on "estudoEstetica_agendamento" for update
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

create policy "agendamento: publico insere sem auth"
  on "estudoEstetica_agendamento" for insert
  with check (true);
