-- ============================================================================
-- Pantax Sistema — habilita lançamento manual de notas fiscais e CT-e.
-- Rode depois de schema_migration.sql / rls_and_auth_migration.sql / apuracao_functions.sql.
--
-- Lançamentos manuais não têm necessariamente uma Chave de Acesso de 44
-- dígitos (a planilha de origem sempre tem; o usuário digitando à mão pode
-- não ter). O unique(empresa_id, chave_acesso) continua funcionando com a
-- coluna nullable — o Postgres nunca considera dois NULLs conflitantes numa
-- constraint unique, então múltiplos lançamentos manuais sem chave convivem
-- normalmente.
-- ============================================================================

alter table public.notas_fiscais alter column chave_acesso drop not null;
alter table public.cte_documentos alter column chave_acesso drop not null;
