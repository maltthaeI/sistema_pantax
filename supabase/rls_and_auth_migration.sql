-- ============================================================================
-- Pantax Sistema — RLS + Auth.
-- Rode depois de schema_migration.sql. Idempotente (seguro rodar de novo).
-- ============================================================================

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- Função auxiliar: nível do usuário logado. SECURITY DEFINER + search_path
-- fixo: lê profiles ignorando a própria RLS da tabela (senão as políticas
-- abaixo cairiam em recursão).
-- ----------------------------------------------------------------------------
create or replace function public.nivel_atual()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select nivel from public.profiles where id = auth.uid();
$$;

grant execute on function public.nivel_atual() to authenticated, anon;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ----------------------------------------------------------------------------
-- profiles — leitura liberada para qualquer logado; escrita direta só por
-- Administrador (criação normal de usuários passa por /api/usuarios, service role).
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all to authenticated
  using (nivel_atual() = 'Administrador')
  with check (nivel_atual() = 'Administrador');

-- ----------------------------------------------------------------------------
-- empresas — leitura livre para qualquer logado (acesso office-wide,
-- confirmado com o usuário); escrita só Administrador.
-- ----------------------------------------------------------------------------
alter table public.empresas enable row level security;
drop policy if exists "empresas_select" on public.empresas;
drop policy if exists "empresas_write" on public.empresas;
create policy "empresas_select" on public.empresas for select to authenticated using (true);
create policy "empresas_write" on public.empresas for all to authenticated
  using (nivel_atual() = 'Administrador') with check (nivel_atual() = 'Administrador');

-- ----------------------------------------------------------------------------
-- periodos_apuracao — leitura/criação livre; fechar/reabrir (update de status)
-- é feito via /api/apuracao/{fechar,reabrir} (service role), que já valida
-- Administrador no servidor. Update direto pelo client também restrito a
-- Administrador, para não abrir brecha de editar campos do período fechado.
-- ----------------------------------------------------------------------------
alter table public.periodos_apuracao enable row level security;
drop policy if exists "periodos_select" on public.periodos_apuracao;
drop policy if exists "periodos_insert" on public.periodos_apuracao;
drop policy if exists "periodos_update" on public.periodos_apuracao;
create policy "periodos_select" on public.periodos_apuracao for select to authenticated using (true);
create policy "periodos_insert" on public.periodos_apuracao for insert to authenticated with check (true);
create policy "periodos_update" on public.periodos_apuracao for update to authenticated
  using (nivel_atual() = 'Administrador') with check (nivel_atual() = 'Administrador');

-- ----------------------------------------------------------------------------
-- import_batches, notas_fiscais, nota_fiscal_itens, cte_documentos —
-- leitura/escrita liberada para os dois papéis (import é rotina operacional).
-- ----------------------------------------------------------------------------
alter table public.import_batches enable row level security;
drop policy if exists "import_batches_all" on public.import_batches;
create policy "import_batches_all" on public.import_batches for all to authenticated using (true) with check (true);

alter table public.notas_fiscais enable row level security;
drop policy if exists "notas_fiscais_all" on public.notas_fiscais;
create policy "notas_fiscais_all" on public.notas_fiscais for all to authenticated using (true) with check (true);

alter table public.nota_fiscal_itens enable row level security;
drop policy if exists "nota_fiscal_itens_all" on public.nota_fiscal_itens;
create policy "nota_fiscal_itens_all" on public.nota_fiscal_itens for all to authenticated using (true) with check (true);

alter table public.cte_documentos enable row level security;
drop policy if exists "cte_documentos_all" on public.cte_documentos;
create policy "cte_documentos_all" on public.cte_documentos for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- snapshots de apuração — gravados só pelo route handler de fechamento
-- (service role), mas liberamos select para todo logado (auditoria/histórico).
-- Sem insert/update/delete direto pelo client.
-- ----------------------------------------------------------------------------
alter table public.apuracao_icms_snapshot enable row level security;
drop policy if exists "apuracao_icms_snapshot_select" on public.apuracao_icms_snapshot;
create policy "apuracao_icms_snapshot_select" on public.apuracao_icms_snapshot for select to authenticated using (true);

alter table public.apuracao_pis_cofins_snapshot enable row level security;
drop policy if exists "apuracao_pis_cofins_snapshot_select" on public.apuracao_pis_cofins_snapshot;
create policy "apuracao_pis_cofins_snapshot_select" on public.apuracao_pis_cofins_snapshot for select to authenticated using (true);

-- ============================================================================
-- FIM. Próximo passo: apuracao_functions.sql, depois criar o 1º usuário
-- Administrador (auth.users + insert manual em public.profiles).
-- ============================================================================
