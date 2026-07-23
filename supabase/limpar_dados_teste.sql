-- ============================================================================
-- Pantax Sistema — limpeza dos dados de teste antes de publicar.
-- Só apaga dados (empresas/importações/resumos criados durante os testes) —
-- schema, RLS e o usuário admin continuam intactos.
-- ============================================================================

delete from public.nfe_resumo_cfop;
delete from public.import_batches;
delete from public.empresas;

-- ============================================================================
-- FIM.
-- ============================================================================
