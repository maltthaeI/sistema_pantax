-- ============================================================================
-- Pantax Sistema — colunas extras no resumo por CFOP (IPI, ICMS, ICMS ST,
-- ICMS UF destino). Rode depois de nfe_empresa_competencia_migration.sql.
-- ============================================================================

drop view if exists public.nfe_resumo_cfop;

create view public.nfe_resumo_cfop
  with (security_invoker = true) as
select
  empresa_id,
  ano,
  mes,
  tipo_calculo,
  cfop,
  cfop_direcao,
  count(*) as quantidade,
  sum(valor_total) as valor_total,
  sum(valor_ipi) as valor_ipi,
  sum(valor_icms) as valor_icms,
  sum(valor_icms_st) as valor_icms_st,
  sum(valor_icms_uf_destino) as valor_icms_uf_destino
from public.nfe_linhas
where status = 'Autorizada'
group by empresa_id, ano, mes, tipo_calculo, cfop, cfop_direcao;

grant select on public.nfe_resumo_cfop to authenticated;

-- ============================================================================
-- FIM.
-- ============================================================================
