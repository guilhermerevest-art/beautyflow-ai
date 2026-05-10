-- =============================================================================
-- Migração 005: Corrige recursão infinita (42P17) nas políticas RLS
--
-- Problema: as políticas de estudoEstetica_profissional referenciam a própria
-- tabela em subqueries, causando recursão infinita quando o Postgres avalia RLS.
--
-- Solução: criar funções SECURITY DEFINER que executam fora do contexto RLS,
-- eliminando a auto-referência. Todas as políticas passam a usar essas funções.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Funções auxiliares SECURITY DEFINER (executam sem RLS aplicado)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_studio_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT studio_id
  FROM "estudoEstetica_profissional"
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM "estudoEstetica_profissional"
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profissional_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id
  FROM "estudoEstetica_profissional"
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- 2. Corrige estudoEstetica_profissional (causa raiz da recursão)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profissional: acessa proprio studio"    ON "estudoEstetica_profissional";
DROP POLICY IF EXISTS "profissional: dona gerencia"            ON "estudoEstetica_profissional";
DROP POLICY IF EXISTS "profissional: dona gerencia insert"     ON "estudoEstetica_profissional";
DROP POLICY IF EXISTS "profissional: dona gerencia update"     ON "estudoEstetica_profissional";
DROP POLICY IF EXISTS "profissional: dona gerencia delete"     ON "estudoEstetica_profissional";

-- SELECT: cada usuário vê os profissionais do seu próprio studio.
-- Usa a função SECURITY DEFINER — sem auto-referência.
CREATE POLICY "profissional: acessa proprio studio"
  ON "estudoEstetica_profissional" FOR SELECT
  USING (studio_id = public.get_my_studio_id());

-- INSERT: somente donas podem inserir novos profissionais no seu studio.
CREATE POLICY "profissional: dona gerencia insert"
  ON "estudoEstetica_profissional" FOR INSERT
  WITH CHECK (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- UPDATE: somente donas podem atualizar profissionais do seu studio.
CREATE POLICY "profissional: dona gerencia update"
  ON "estudoEstetica_profissional" FOR UPDATE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- DELETE: somente donas podem remover profissionais do seu studio.
CREATE POLICY "profissional: dona gerencia delete"
  ON "estudoEstetica_profissional" FOR DELETE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- -----------------------------------------------------------------------------
-- 3. Corrige estudoEstetica_studio
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "studio: dona acessa proprio studio" ON "estudoEstetica_studio";

CREATE POLICY "studio: dona acessa proprio studio"
  ON "estudoEstetica_studio" FOR ALL
  USING (id = public.get_my_studio_id());

-- -----------------------------------------------------------------------------
-- 4. Atualiza estudoEstetica_agendamento (usa função em vez de subquery inline)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "agendamento: dona ve todos do studio"  ON "estudoEstetica_agendamento";
DROP POLICY IF EXISTS "agendamento: ajudante ve proprios"     ON "estudoEstetica_agendamento";
DROP POLICY IF EXISTS "agendamento: profissional insere"      ON "estudoEstetica_agendamento";
DROP POLICY IF EXISTS "agendamento: profissional atualiza"    ON "estudoEstetica_agendamento";
DROP POLICY IF EXISTS "agendamento: publico insere sem auth"  ON "estudoEstetica_agendamento";

CREATE POLICY "agendamento: dona ve todos do studio"
  ON "estudoEstetica_agendamento" FOR SELECT
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "agendamento: ajudante ve proprios"
  ON "estudoEstetica_agendamento" FOR SELECT
  USING (profissional_id = public.get_my_profissional_id());

CREATE POLICY "agendamento: profissional insere"
  ON "estudoEstetica_agendamento" FOR INSERT
  WITH CHECK (studio_id = public.get_my_studio_id());

CREATE POLICY "agendamento: profissional atualiza"
  ON "estudoEstetica_agendamento" FOR UPDATE
  USING (studio_id = public.get_my_studio_id());

-- Agendamento público (booking sem autenticação)
CREATE POLICY "agendamento: publico insere sem auth"
  ON "estudoEstetica_agendamento" FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. Atualiza estudoEstetica_cliente
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cliente: profissionais do studio acessam"  ON "estudoEstetica_cliente";
DROP POLICY IF EXISTS "cliente: profissionais do studio select"   ON "estudoEstetica_cliente";
DROP POLICY IF EXISTS "cliente: profissionais do studio insert"   ON "estudoEstetica_cliente";
DROP POLICY IF EXISTS "cliente: profissionais do studio update"   ON "estudoEstetica_cliente";
DROP POLICY IF EXISTS "cliente: dona pode deletar"                ON "estudoEstetica_cliente";

CREATE POLICY "cliente: profissionais do studio select"
  ON "estudoEstetica_cliente" FOR SELECT
  USING (studio_id = public.get_my_studio_id());

CREATE POLICY "cliente: profissionais do studio insert"
  ON "estudoEstetica_cliente" FOR INSERT
  WITH CHECK (studio_id = public.get_my_studio_id());

CREATE POLICY "cliente: profissionais do studio update"
  ON "estudoEstetica_cliente" FOR UPDATE
  USING (studio_id = public.get_my_studio_id());

CREATE POLICY "cliente: dona pode deletar"
  ON "estudoEstetica_cliente" FOR DELETE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- -----------------------------------------------------------------------------
-- 6. Atualiza estudoEstetica_servico
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "servico: dona gerencia"        ON "estudoEstetica_servico";
DROP POLICY IF EXISTS "servico: dona gerencia insert"  ON "estudoEstetica_servico";
DROP POLICY IF EXISTS "servico: dona gerencia update"  ON "estudoEstetica_servico";
DROP POLICY IF EXISTS "servico: dona gerencia delete"  ON "estudoEstetica_servico";

CREATE POLICY "servico: dona gerencia insert"
  ON "estudoEstetica_servico" FOR INSERT
  WITH CHECK (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "servico: dona gerencia update"
  ON "estudoEstetica_servico" FOR UPDATE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "servico: dona gerencia delete"
  ON "estudoEstetica_servico" FOR DELETE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- -----------------------------------------------------------------------------
-- 7. Atualiza estudoEstetica_produto
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "produto: profissionais leem"      ON "estudoEstetica_produto";
DROP POLICY IF EXISTS "produto: dona gerencia insert"    ON "estudoEstetica_produto";
DROP POLICY IF EXISTS "produto: dona gerencia update"    ON "estudoEstetica_produto";
DROP POLICY IF EXISTS "produto: dona gerencia delete"    ON "estudoEstetica_produto";

CREATE POLICY "produto: profissionais leem"
  ON "estudoEstetica_produto" FOR SELECT
  USING (studio_id = public.get_my_studio_id());

CREATE POLICY "produto: dona gerencia insert"
  ON "estudoEstetica_produto" FOR INSERT
  WITH CHECK (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "produto: dona gerencia update"
  ON "estudoEstetica_produto" FOR UPDATE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "produto: dona gerencia delete"
  ON "estudoEstetica_produto" FOR DELETE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- -----------------------------------------------------------------------------
-- 8. Atualiza estudoEstetica_produto_venda
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "produto_venda: profissionais do studio" ON "estudoEstetica_produto_venda";

CREATE POLICY "produto_venda: profissionais do studio"
  ON "estudoEstetica_produto_venda" FOR ALL
  USING (studio_id = public.get_my_studio_id());

-- -----------------------------------------------------------------------------
-- 9. Atualiza estudoEstetica_pagamento
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "pagamento: apenas dona acessa" ON "estudoEstetica_pagamento";

CREATE POLICY "pagamento: apenas dona acessa"
  ON "estudoEstetica_pagamento" FOR ALL
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- -----------------------------------------------------------------------------
-- 10. Atualiza estudoEstetica_pacote_definicao
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "pacote_definicao: profissionais leem"      ON "estudoEstetica_pacote_definicao";
DROP POLICY IF EXISTS "pacote_definicao: dona gerencia insert"    ON "estudoEstetica_pacote_definicao";
DROP POLICY IF EXISTS "pacote_definicao: dona gerencia update"    ON "estudoEstetica_pacote_definicao";
DROP POLICY IF EXISTS "pacote_definicao: dona gerencia delete"    ON "estudoEstetica_pacote_definicao";

CREATE POLICY "pacote_definicao: profissionais leem"
  ON "estudoEstetica_pacote_definicao" FOR SELECT
  USING (studio_id = public.get_my_studio_id());

CREATE POLICY "pacote_definicao: dona gerencia insert"
  ON "estudoEstetica_pacote_definicao" FOR INSERT
  WITH CHECK (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "pacote_definicao: dona gerencia update"
  ON "estudoEstetica_pacote_definicao" FOR UPDATE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

CREATE POLICY "pacote_definicao: dona gerencia delete"
  ON "estudoEstetica_pacote_definicao" FOR DELETE
  USING (
    studio_id = public.get_my_studio_id()
    AND public.get_my_role() = 'dona'
  );

-- -----------------------------------------------------------------------------
-- 11. Atualiza estudoEstetica_pacote_cliente
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "pacote_cliente: profissionais do studio" ON "estudoEstetica_pacote_cliente";

CREATE POLICY "pacote_cliente: profissionais do studio"
  ON "estudoEstetica_pacote_cliente" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "estudoEstetica_cliente" c
      WHERE c.id = "estudoEstetica_pacote_cliente".cliente_id
        AND c.studio_id = public.get_my_studio_id()
    )
  );
