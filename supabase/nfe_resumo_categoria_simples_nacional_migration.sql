-- ============================================================================
-- Pantax Sistema — Recebidas passa a separar por Categoria (Revenda / Uso e
-- Consumo, lida da coluna "Categoria" da planilha) em vez de cfop_direcao
-- (Entrada/Saída, que continua valendo pra Emitidas/CT-e), e troca a última
-- coluna da tela por "Valor do ICMS Simples Nacional".
-- Rode depois de nfe_resumo_tabela_migration.sql.
-- ============================================================================

alter table public.nfe_resumo_cfop add column if not exists categoria text;
alter table public.nfe_resumo_cfop add column if not exists valor_icms_simples_nacional numeric(14,2) not null default 0;

-- categoria entra na chave de unicidade pra Revenda e Uso e Consumo do mesmo
-- CFOP (Recebidas) gravarem como linhas separadas em vez de se sobrescreverem.
-- Nome da constraint original foi auto-gerado pelo Postgres (truncado em 63
-- chars) então é achado dinamicamente em vez de citado literalmente.
do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
  from pg_constraint
  where conrelid = 'public.nfe_resumo_cfop'::regclass and contype = 'u';
  if nome_constraint is not null then
    execute format('alter table public.nfe_resumo_cfop drop constraint %I', nome_constraint);
  end if;
end $$;

alter table public.nfe_resumo_cfop add constraint nfe_resumo_cfop_empresa_ano_mes_tipo_cfop_dir_cat_key
  unique (empresa_id, ano, mes, tipo_calculo, cfop, cfop_direcao, categoria);

-- ============================================================================
-- FIM.
-- ============================================================================
