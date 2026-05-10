-- Pagamento
create table "estudoEstetica_pagamento" (
  id uuid primary key default gen_random_uuid(),
  agendamento_id uuid unique references "estudoEstetica_agendamento"(id) on delete cascade,
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  valor numeric(10,2) not null,
  forma_pagamento text not null check (forma_pagamento in ('dinheiro','pix','cartao')),
  data date not null default current_date,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_pagamento" enable row level security;

create policy "pagamento: apenas dona acessa"
  on "estudoEstetica_pagamento" for all
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );

-- Produto
create table "estudoEstetica_produto" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null default 0,
  estoque int not null default 0,
  estoque_minimo int not null default 5,
  ativo boolean default true,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_produto" enable row level security;

create policy "produto: profissionais leem"
  on "estudoEstetica_produto" for select
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

create policy "produto: dona gerencia"
  on "estudoEstetica_produto" for insert update delete
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
    and (select role from "estudoEstetica_profissional" where user_id = auth.uid() limit 1) = 'dona'
  );

-- Produto Venda
create table "estudoEstetica_produto_venda" (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references "estudoEstetica_studio"(id) on delete cascade,
  produto_id uuid not null references "estudoEstetica_produto"(id),
  cliente_id uuid references "estudoEstetica_cliente"(id) on delete set null,
  quantidade int not null default 1,
  valor numeric(10,2) not null,
  tipo text not null check (tipo in ('venda_avulsa','uso_atendimento')),
  data date not null default current_date,
  criado_em timestamptz default now()
);

alter table "estudoEstetica_produto_venda" enable row level security;

create policy "produto_venda: profissionais do studio"
  on "estudoEstetica_produto_venda" for all
  using (
    studio_id = (select studio_id from "estudoEstetica_profissional" where user_id = auth.uid() limit 1)
  );

-- Trigger: decrementa estoque ao registrar venda
create or replace function fn_decrementa_estoque()
returns trigger language plpgsql as $$
begin
  update "estudoEstetica_produto" set estoque = estoque - NEW.quantidade where id = NEW.produto_id;
  return NEW;
end;
$$;

create trigger trg_decrementa_estoque
  after insert on "estudoEstetica_produto_venda"
  for each row execute function fn_decrementa_estoque();
