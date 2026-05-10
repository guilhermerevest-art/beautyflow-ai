-- Habilita extensões necessárias
create extension if not exists pg_net schema extensions;
create extension if not exists pg_cron;

-- Agenda chamada diária às 11h UTC (8h horário de Brasília)
select cron.schedule(
  'lembrete-whatsapp-diario',
  '0 11 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/lembrete-whatsapp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
