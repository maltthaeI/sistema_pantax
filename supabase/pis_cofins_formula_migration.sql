-- ============================================================================
-- Pantax Sistema — PIS/COFINS não é soma direta da planilha (confirmado pelo
-- arquivo de referência "Grand Variety - Previa.xlsx"): é Base de Cálculo
-- (Valor Total menos ICMS/ICMS ST/IPI, conforme o caso) x Alíquota (1,65%
-- PIS / 7,6% COFINS). valor_pis/valor_cofins nunca são usados nessa fórmula —
-- descarta as colunas. Rode depois de nfe_origem_pis_cofins_migration.sql.
-- ============================================================================

alter table public.nfe_resumo_cfop
  drop column if exists valor_pis,
  drop column if exists valor_cofins;

-- ============================================================================
-- FIM.
-- ============================================================================
