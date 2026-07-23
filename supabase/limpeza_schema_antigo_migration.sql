-- ============================================================================
-- Pantax Sistema — limpeza do schema antigo (fluxo de 3 uploads separados +
-- apuração ICMS/PIS-COFINS por período, substituído por nfe_linhas).
-- Todas essas tabelas estavam vazias (0 linhas) no momento desta limpeza —
-- nada é perdido. Rode depois de nfe_resumo_colunas_extras_migration.sql.
-- ============================================================================

drop table if exists public.nota_fiscal_itens cascade;
drop table if exists public.notas_fiscais cascade;
drop table if exists public.cte_documentos cascade;
drop table if exists public.apuracao_icms_snapshot cascade;
drop table if exists public.apuracao_pis_cofins_snapshot cascade;
drop table if exists public.periodos_apuracao cascade;

drop function if exists public.calcular_apuracao_icms(uuid);
drop function if exists public.calcular_apuracao_pis_cofins(uuid);

-- import_batches só serve mais o fluxo unificado de NF-e.
alter table public.import_batches drop constraint if exists import_batches_tipo_arquivo_check;
alter table public.import_batches add constraint import_batches_tipo_arquivo_check
  check (tipo_arquivo = 'nfe');

-- ============================================================================
-- FIM.
-- ============================================================================
