-- Habilita extensão UUID
create extension if not exists "pgcrypto";

-- Studio
create table "estudoEstetica_studio" (
  id uuid primary key default gen_random_uuid(),
  sistema_id uuid not null default 'c8553915-5cfd-47bf-aca5-aeb865be82cb',
  nome text not null,
  slug text not null unique,
  email text not null unique,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_studio" enable row level security;

create policy "studio: dona acessa proprio studio"
  on "estudoEstetica_studio" for all
  using (id = (
    select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1
  ));

-- Profissional
create table "estudoEstetica_profissional" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  role text not null check (role in ('dona', 'ajudante')),
  ativo boolean default true,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_profissional" enable row level security;

create policy "profissional: acessa proprio studio"
  on "estudoEstetica_profissional" for select
  using (studio_id = (
    select studio_id from "estudoEstetica_profissional" p2 where p2.user_id = auth.uid() limit 1
  ));

create policy "profissional: dona gerencia"
  on "estudoEstetica_profissional" for insert update delete
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" p2 where p2.user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" p3 where p3.user_id = auth.uid() limit 1) = 'dona'
  );

-- Servico
create table "estudoEstetica_servico" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null,
  duracao_min int not null,
  ativo boolean default true,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_servico" enable row level security;

create policy "servico: leitura publica por studio"
  on "estudoEstetica_servico" for select
  using (true);

create policy "servico: dona gerencia"
  on "estudoEstetica_servico" for insert update delete
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );

-- Cliente
create table "estudoEstetica_cliente" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  nome text not null,
  whatsapp text not null,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_cliente" enable row level security;

create policy "cliente: profissionais do studio acessam"
  on "estudoEstetica_cliente" for select insert update
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

create policy "cliente: dona pode deletar"
  on "estudoEstetica_cliente" for delete
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );
