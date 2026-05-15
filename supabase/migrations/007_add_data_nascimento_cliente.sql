-- Adiciona campo data_nascimento na tabela de clientes
ALTER TABLE "estudoEstetica_cliente"
ADD COLUMN IF NOT EXISTS data_nascimento date;
