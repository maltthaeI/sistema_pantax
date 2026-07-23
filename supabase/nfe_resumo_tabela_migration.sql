-- ============================================================================
-- Pantax Sistema — para de gravar uma linha por item da planilha (18k+ linhas
-- por upload) e passa a gravar só o agregado por CFOP, que é tudo que a tela
-- Resumo mostra. A planilha continua sendo a fonte da verdade: se precisar
-- de outro corte no futuro, reimporta.
--
-- nfe_resumo_cfop deixa de ser view e vira tabela de verdade, gravada
-- diretamente pelo import (mesmo nome — nenhuma tela precisa mudar).
-- Rode depois de nfe_linhas_colunas_minimas_migration.sql.
-- ============================================================================

drop view if exists public.nfe_resumo_cfop;
drop table if exists public.nfe_linhas cascade;

create table public.nfe_resumo_cfop (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  ano int not null,
  mes int not null,
  tipo_calculo text not null check (tipo_calculo in ('previa','fechamento')),
  cfop text not null,
  cfop_direcao text not null check (cfop_direcao in ('entrada','saida')),
  quantidade int not null default 0,
  valor_total numeric(14,2) not null default 0,
  valor_ipi numeric(14,2) not null default 0,
  valor_icms numeric(14,2) not null default 0,
  valor_icms_st numeric(14,2) not null default 0,
  valor_icms_uf_destino numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (empresa_id, ano, mes, tipo_calculo, cfop, cfop_direcao)
);

create index if not exists idx_nfe_resumo_cfop_competencia on public.nfe_resumo_cfop (empresa_id, ano, mes, tipo_calculo);

alter table public.nfe_resumo_cfop enable row level security;
drop policy if exists "nfe_resumo_cfop_all" on public.nfe_resumo_cfop;
create policy "nfe_resumo_cfop_all" on public.nfe_resumo_cfop for all to authenticated using (true) with check (true);

-- Contagem de itens Autorizados/Cancelados (só pro card do Dashboard) vira um
-- número por upload em vez de linha por linha.
alter table public.import_batches add column if not exists itens_autorizados int not null default 0;
alter table public.import_batches add column if not exists itens_cancelados int not null default 0;

-- ============================================================================
-- FIM.
-- ============================================================================
