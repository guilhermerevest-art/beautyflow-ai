-- Pacote Definição
create table "estudoEstetica_pacote_definicao" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  nome text not null,
  sessoes int not null,
  preco numeric(10,2) not null,
  validade_dias int not null default 180,
  ativo boolean default true,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_pacote_definicao" enable row level security;

create policy "pacote_definicao: profissionais leem"
  on "estudoEstetica_pacote_definicao" for select
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

create policy "pacote_definicao: dona gerencia"
  on "estudoEstetica_pacote_definicao" for insert update delete
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );

-- Pacote Cliente
create table "estudoEstetica_pacote_cliente" (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references "estudoEstetica_cliente"(id) on delete cascade,
  pacote_id uuid not null references "estudoEstetica_pacote_definicao"(id),
  sessoes_usadas int not null default 0,
  data_compra date not null default current_date,
  data_expiracao date,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_pacote_cliente" enable row level security;

create policy "pacote_cliente: profissionais do studio"
  on "estudoEstetica_pacote_cliente" for all
  using (
    exists (
      select 1 from "estudoEstetica_cliente" c
      where c.id = "estudoEstetica_pacote_cliente".cliente_id
      and c.studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    )
  );

-- Função: usar sessão do pacote com validação
create or replace function usar_sessao_pacote(p_pacote_cliente_id uuid)
returns void language plpgsql as $$
declare
  v_pc "estudoEstetica_pacote_cliente"%rowtype;
  v_pd "estudoEstetica_pacote_definicao"%rowtype;
begin
  select * into v_pc from "estudoEstetica_pacote_cliente" where id = p_pacote_cliente_id for update;
  select * into v_pd from "estudoEstetica_pacote_definicao" where id = v_pc.pacote_id;

  if v_pc.sessoes_usadas >= v_pd.sessoes then
    raise exception 'Pacote esgotado: todas as sessões já foram utilizadas';
  end if;

  if v_pc.data_expiracao is not null and v_pc.data_expiracao < current_date then
    raise exception 'Pacote expirado em %', v_pc.data_expiracao;
  end if;

  update "estudoEstetica_pacote_cliente" set sessoes_usadas = sessoes_usadas + 1 where id = p_pacote_cliente_id;
end;
$$;
