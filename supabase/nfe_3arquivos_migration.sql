-- ============================================================================
-- Pantax Sistema — upload passa a ser 3 arquivos (Emitidas, Recebidas, CT-e)
-- enviados juntos numa única importação, em vez de 1 arquivo unificado.
-- Rode depois de nfe_resumo_tabela_migration.sql.
-- ============================================================================

alter table public.import_batches
  drop column if exists nome_arquivo,
  add column if not exists nome_arquivo_emitidas text,
  add column if not exists nome_arquivo_recebidas text,
  add column if not exists nome_arquivo_cte text;

-- ============================================================================
-- FIM.
-- ============================================================================
