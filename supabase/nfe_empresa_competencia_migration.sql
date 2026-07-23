-- ============================================================================
-- Pantax Sistema — empresa automática (nome extraído do arquivo) + competência
-- (Prévia/Fechamento por mês). Rode depois de nfe_linhas_migration.sql.
-- Idempotente (seguro rodar de novo).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- empresas: agora nascem do upload (só o nome) — CNPJ e regime tributário
-- deixam de ser obrigatórios. Nome vira a chave natural (find-or-create).
-- ----------------------------------------------------------------------------
alter table public.empresas alter column cnpj drop not null;
alter table public.empresas alter column regime_tributario drop not null;
alter table public.empresas drop constraint if exists empresas_regime_tributario_check;
alter table public.empresas add constraint empresas_regime_tributario_check
  check (regime_tributario is null or regime_tributario in ('Lucro Real','Lucro Presumido','Simples Nacional'));
create unique index if not exists idx_empresas_razao_social_lower on public.empresas (lower(razao_social));

-- ----------------------------------------------------------------------------
-- import_batches: cada upload registra a competência (ano/mês) e o tipo de
-- cálculo (Prévia, do dia 1 ao 20, ou Fechamento, do dia 1 ao 30/31).
-- ----------------------------------------------------------------------------
alter table public.import_batches add column if not exists tipo_calculo text check (tipo_calculo in ('previa','fechamento'));
alter table public.import_batches add column if not exists ano int;
alter table public.import_batches add column if not exists mes int;

-- ----------------------------------------------------------------------------
-- nfe_linhas: idem — Prévia e Fechamento do mesmo mês convivem (não se
-- sobrescrevem); só um novo upload da MESMA competência + tipo substitui o anterior.
-- ----------------------------------------------------------------------------
alter table public.nfe_linhas add column if not exists tipo_calculo text check (tipo_calculo in ('previa','fechamento'));
alter table public.nfe_linhas add column if not exists ano int;
alter table public.nfe_linhas add column if not exists mes int;
create index if not exists idx_nfe_linhas_competencia on public.nfe_linhas (empresa_id, ano, mes, tipo_calculo);

-- ----------------------------------------------------------------------------
-- view de resumo: agora também segmentada por competência. Precisa dropar
-- antes de recriar — CREATE OR REPLACE VIEW não permite inserir colunas no
-- meio da lista original (só no final), e aqui a ordem muda.
-- ----------------------------------------------------------------------------
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
  sum(valor_total) as valor_total
from public.nfe_linhas
where status = 'Autorizada'
group by empresa_id, ano, mes, tipo_calculo, cfop, cfop_direcao;

grant select on public.nfe_resumo_cfop to authenticated;

-- ============================================================================
-- FIM.
-- ============================================================================
