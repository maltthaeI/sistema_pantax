-- ============================================================================
-- Sistema Pantax — acesso demo (somente leitura), para link de currículo.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Dashboard > SQL Editor).
--
-- IMPORTANTE — leia antes de rodar: este repositório não tem nenhuma migração
-- de RLS versionada (diferente do berlim-sistema). Isso significa que não sei,
-- só lendo o código, se já existem policies em empresas/import_batches/
-- nfe_resumo_cfop, nem com quais nomes. Por segurança, este script:
--   1) Garante RLS ligada nessas tabelas.
--   2) Apaga QUALQUER policy pré-existente nelas (via bloco DO abaixo, não
--      importa o nome) e recria do zero. Se você tinha alguma regra custom
--      além de "Operador/Administrador veem tudo", ela será substituída —
--      confira a seção 3 antes de rodar, e ajuste se precisar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Libera 'Demo' como nível válido em profiles.
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_nivel_check;
alter table public.profiles add constraint profiles_nivel_check
  check (nivel in ('Operador','Administrador','Demo'));

-- ----------------------------------------------------------------------------
-- 2) Função auxiliar: nível do usuário logado (mesmo padrão do berlim-sistema).
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
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.empresas, public.import_batches, public.nfe_resumo_cfop to authenticated;

-- ----------------------------------------------------------------------------
-- 3) Empresa fictícia para o usuário demo ver — nunca as empresas reais.
-- ----------------------------------------------------------------------------
insert into public.empresas (razao_social)
select 'Empresa Demonstração Ltda'
where not exists (select 1 from public.empresas where razao_social = 'Empresa Demonstração Ltda');

-- Um batch de exemplo vazio, só pra empresa demo aparecer com alguma atividade
-- no Dashboard. NÃO populamos nfe_resumo_cfop aqui: essa tabela tem colunas
-- obrigatórias (ano, mes, tipo_calculo, origem, cfop_direcao, entre outras)
-- que só o próprio fluxo de import (lib/xlsxParsers/importarRelatorioNfe.js)
-- preenche corretamente — um insert manual arriscava errar alguma delas. As
-- telas de Resumo/CFOP ficam vazias para o demo; se quiser dados de exemplo
-- ali, o jeito mais seguro é logar como Administrador e importar uma planilha
-- de teste pra essa empresa depois de rodar esta migração.
do $$
declare
  v_empresa_id uuid;
begin
  select id into v_empresa_id from public.empresas where razao_social = 'Empresa Demonstração Ltda';

  if not exists (select 1 from public.import_batches where empresa_id = v_empresa_id) then
    insert into public.import_batches (empresa_id, tipo_arquivo, tipo_calculo, status)
    values (v_empresa_id, 'nfe', 'fechamento', 'concluido');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4) profiles — leitura liberada pra qualquer logado (nome/nível usados na UI);
--    escrita só Administrador.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_admin_write" on public.profiles for all to authenticated
  using (nivel_atual() = 'Administrador') with check (nivel_atual() = 'Administrador');

-- ----------------------------------------------------------------------------
-- 5) empresas — Operador/Administrador veem todas; Demo só a fictícia criada
--    acima. Escrita (criar empresa a partir de um import) fica fora do Demo.
-- ----------------------------------------------------------------------------
alter table public.empresas enable row level security;
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'empresas' loop
    execute format('drop policy %I on public.empresas', pol.policyname);
  end loop;
end $$;

create policy "empresas_select" on public.empresas for select to authenticated
  using (
    nivel_atual() in ('Operador','Administrador')
    or (nivel_atual() = 'Demo' and razao_social = 'Empresa Demonstração Ltda')
  );
create policy "empresas_write" on public.empresas for insert to authenticated
  with check (nivel_atual() in ('Operador','Administrador'));
create policy "empresas_update" on public.empresas for update to authenticated
  using (nivel_atual() in ('Operador','Administrador')) with check (nivel_atual() in ('Operador','Administrador'));
create policy "empresas_delete" on public.empresas for delete to authenticated
  using (nivel_atual() = 'Administrador');

-- ----------------------------------------------------------------------------
-- 6) import_batches e nfe_resumo_cfop — mesmo padrão: Demo só enxerga linhas
--    da empresa fictícia (via empresa_id), sem nenhuma escrita liberada.
-- ----------------------------------------------------------------------------
alter table public.import_batches enable row level security;
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'import_batches' loop
    execute format('drop policy %I on public.import_batches', pol.policyname);
  end loop;
end $$;

create policy "import_batches_select" on public.import_batches for select to authenticated
  using (
    nivel_atual() in ('Operador','Administrador')
    or (nivel_atual() = 'Demo' and empresa_id in (select id from public.empresas where razao_social = 'Empresa Demonstração Ltda'))
  );
create policy "import_batches_write" on public.import_batches for insert to authenticated
  with check (nivel_atual() in ('Operador','Administrador'));
create policy "import_batches_update" on public.import_batches for update to authenticated
  using (nivel_atual() in ('Operador','Administrador')) with check (nivel_atual() in ('Operador','Administrador'));
create policy "import_batches_delete" on public.import_batches for delete to authenticated
  using (nivel_atual() = 'Administrador');

alter table public.nfe_resumo_cfop enable row level security;
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'nfe_resumo_cfop' loop
    execute format('drop policy %I on public.nfe_resumo_cfop', pol.policyname);
  end loop;
end $$;

create policy "nfe_resumo_cfop_select" on public.nfe_resumo_cfop for select to authenticated
  using (
    nivel_atual() in ('Operador','Administrador')
    or (nivel_atual() = 'Demo' and empresa_id in (select id from public.empresas where razao_social = 'Empresa Demonstração Ltda'))
  );
create policy "nfe_resumo_cfop_write" on public.nfe_resumo_cfop for insert to authenticated
  with check (nivel_atual() in ('Operador','Administrador'));
create policy "nfe_resumo_cfop_update" on public.nfe_resumo_cfop for update to authenticated
  using (nivel_atual() in ('Operador','Administrador')) with check (nivel_atual() in ('Operador','Administrador'));
create policy "nfe_resumo_cfop_delete" on public.nfe_resumo_cfop for delete to authenticated
  using (nivel_atual() = 'Administrador');

-- ============================================================================
-- FIM. Depois de rodar isto:
--   1) Crie o usuário demo em Authentication > Users (e-mail/senha) no painel
--      do Supabase (a tela "Novo Usuário" do app não está acessível pela
--      Sidebar hoje — ver contexto do pedido).
--   2) Pegue o UUID gerado e rode:
--        insert into public.profiles (id, nome, nivel)
--        values ('<uuid-gerado>', 'Visitante Demo', 'Demo');
--   3) Configure NEXT_PUBLIC_DEMO_EMAIL/NEXT_PUBLIC_DEMO_SENHA no Vercel
--      deste projeto e re-deploy.
-- ============================================================================
