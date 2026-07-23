-- ============================================================================
-- Pantax Sistema — nfe_resumo_cfop passa a ser separado por origem (Emitidas,
-- Recebidas, CT-e) em vez de combinado, pra virar 3 telas independentes.
-- Adiciona também Valor do PIS e Valor do COFINS (somados), necessários pra
-- apuração de PIS/COFINS. Recria a tabela do zero — só tinha dado de teste.
-- Rode depois de nfe_3arquivos_migration.sql.
-- ============================================================================

drop table if exists public.nfe_resumo_cfop cascade;

create table public.nfe_resumo_cfop (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  ano int not null,
  mes int not null,
  tipo_calculo text not null check (tipo_calculo in ('previa','fechamento')),
  origem text not null check (origem in ('emitidas','recebidas','cte')),
  cfop text not null,
  cfop_direcao text not null check (cfop_direcao in ('entrada','saida')),
  quantidade int not null default 0,
  valor_total numeric(14,2) not null default 0,
  valor_ipi numeric(14,2) not null default 0,
  valor_icms numeric(14,2) not null default 0,
  valor_icms_st numeric(14,2) not null default 0,
  valor_icms_uf_destino numeric(14,2) not null default 0,
  valor_pis numeric(14,2) not null default 0,
  valor_cofins numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (empresa_id, ano, mes, tipo_calculo, origem, cfop, cfop_direcao)
);

create index if not exists idx_nfe_resumo_cfop_competencia on public.nfe_resumo_cfop (empresa_id, ano, mes, tipo_calculo, origem);

alter table public.nfe_resumo_cfop enable row level security;
drop policy if exists "nfe_resumo_cfop_all" on public.nfe_resumo_cfop;
create policy "nfe_resumo_cfop_all" on public.nfe_resumo_cfop for all to authenticated using (true) with check (true);

-- ============================================================================
-- FIM.
-- ============================================================================
