-- Seed: cria studio + dona para desenvolvimento
-- Execute no Supabase SQL Editor após criar o usuário via Auth

-- 1. Crie o usuário no Supabase Auth Dashboard (Authentication > Users > Add user)
--    Email: dona@beautyflow.com  Senha: beautyflow123

-- 2. Copie o UUID gerado e substitua abaixo:
do $$
declare
  v_user_id uuid := 'COLE-AQUI-O-UUID-DO-USUARIO'; -- substituir
  v_studio_id uuid := gen_random_uuid();
begin
  insert into "estudoEstetica_studio" (id, sistema_id, nome, slug, email)
  values (v_studio_id, 'c8553915-5cfd-47bf-aca5-aeb865be82cb', 'Estúdio Estética', 'estudio-estetica', 'dona@beautyflow.com');

  insert into "estudoEstetica_profissional" (studio_id, user_id, nome, role)
  values (v_studio_id, v_user_id, 'Dona do Estúdio', 'dona');

  -- Serviços de exemplo
  insert into "estudoEstetica_servico" (studio_id, nome, preco, duracao_min) values
    (v_studio_id, 'Limpeza de Pele', 150.00, 60),
    (v_studio_id, 'Design de Sobrancelha', 60.00, 30),
    (v_studio_id, 'Massagem Relaxante', 120.00, 50),
    (v_studio_id, 'Peeling Químico', 200.00, 90);
end $$;
