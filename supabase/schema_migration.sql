-- ============================================================================
-- Pantax Sistema — schema inicial.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Dashboard > SQL Editor),
-- seguido de rls_and_auth_migration.sql e apuracao_functions.sql.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) profiles — 1 linha por usuário do Supabase Auth (id = auth.users.id)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  nivel text not null check (nivel in ('Operador','Administrador')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2) empresas — clientes do escritório de contabilidade
-- ----------------------------------------------------------------------------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text not null unique,
  regime_tributario text not null check (regime_tributario in ('Lucro Real','Lucro Presumido','Simples Nacional')),
  aliquota_pis_debito numeric(6,4) not null default 0,
  aliquota_pis_credito numeric(6,4) not null default 0,
  aliquota_cofins_debito numeric(6,4) not null default 0,
  aliquota_cofins_credito numeric(6,4) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3) periodos_apuracao — competência (mês/ano) por empresa
-- ----------------------------------------------------------------------------
create table if not exists public.periodos_apuracao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  ano int not null,
  mes int not null check (mes between 1 and 12),
  status text not null default 'aberto' check (status in ('aberto','fechado')),
  credito_icms_acumulado_anterior numeric(14,2) not null default 0,
  estorno_debito_manual numeric(14,2) not null default 0,
  fechado_em timestamptz,
  fechado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (empresa_id, ano, mes)
);

-- ----------------------------------------------------------------------------
-- 4) import_batches — log de auditoria de cada upload
-- ----------------------------------------------------------------------------
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  periodo_id uuid references public.periodos_apuracao(id),
  tipo_arquivo text not null check (tipo_arquivo in ('cte','emitidas','recebidas')),
  nome_arquivo text,
  linhas_processadas int not null default 0,
  linhas_erro int not null default 0,
  status text not null default 'processando' check (status in ('processando','concluido','erro')),
  erro_detalhe text,
  importado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5) notas_fiscais — unificada emitidas + recebidas via `direcao`
-- ----------------------------------------------------------------------------
create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  periodo_id uuid not null references public.periodos_apuracao(id) on delete cascade,
  direcao text not null check (direcao in ('emitida','recebida')),
  tipo_operacao text,
  -- nullable: lançamentos manuais (ver manual_entry_migration.sql) nem sempre têm chave de 44 dígitos
  chave_acesso text,
  status text,
  data_emissao date,
  especie text,
  numero_nota text,
  serie text,
  natureza_operacao text,
  emitente_nome text,
  emitente_cnpj text,
  destinatario_nome text,
  destinatario_cnpj text,
  transportadora_nome text,
  transportadora_cnpj text,
  uf text,
  valor_contabil numeric(14,2) default 0,
  base_icms numeric(14,2) default 0,
  valor_icms numeric(14,2) default 0,
  valor_pis numeric(14,2) default 0,
  valor_cofins numeric(14,2) default 0,
  valor_cbs numeric(14,2) default 0,
  valor_ibs_estadual numeric(14,2) default 0,
  valor_ibs_municipal numeric(14,2) default 0,
  valor_ipi numeric(14,2) default 0,
  valor_st numeric(14,2) default 0,
  valor_fcp_uf_destino numeric(14,2) default 0,
  valor_icms_uf_destino numeric(14,2) default 0,
  fcp_st numeric(14,2) default 0,
  manifestacao text,
  descricao text,
  alertas text,
  import_batch_id uuid references public.import_batches(id),
  created_at timestamptz not null default now(),
  unique (empresa_id, chave_acesso)
);

create index if not exists idx_notas_fiscais_apuracao
  on public.notas_fiscais (empresa_id, periodo_id, direcao, tipo_operacao);

-- ----------------------------------------------------------------------------
-- 6) nota_fiscal_itens — linhas de produto por nota
-- ----------------------------------------------------------------------------
create table if not exists public.nota_fiscal_itens (
  id uuid primary key default gen_random_uuid(),
  nota_fiscal_id uuid not null references public.notas_fiscais(id) on delete cascade,
  cod_produto text,
  descricao text,
  categoria text,
  ncm text,
  ean text,
  cest text,
  ex text,
  cfop text,
  origem text,
  cst text,
  csosn text,
  class_trib text,
  valor_produto numeric(14,2) default 0,
  valor_total numeric(14,2) default 0,
  quantidade numeric(14,4) default 0,
  unidade text,
  desconto numeric(14,2) default 0,
  frete numeric(14,2) default 0,
  despesas_acessorias numeric(14,2) default 0,
  base_icms numeric(14,2) default 0,
  aliquota_icms numeric(7,4) default 0,
  valor_icms numeric(14,2) default 0,
  aliquota_icms_sn numeric(7,4) default 0,
  valor_icms_sn numeric(14,2) default 0,
  base_icms_st numeric(14,2) default 0,
  aliquota_icms_st numeric(7,4) default 0,
  valor_icms_st numeric(14,2) default 0,
  icms_retido numeric(14,2) default 0,
  valor_icms_uf_destino numeric(14,2) default 0,
  cst_ipi text,
  base_ipi numeric(14,2) default 0,
  aliquota_ipi numeric(7,4) default 0,
  valor_ipi numeric(14,2) default 0,
  cst_pis text,
  base_pis numeric(14,2) default 0,
  aliquota_pis numeric(7,4) default 0,
  valor_pis numeric(14,2) default 0,
  cst_cofins text,
  base_cofins numeric(14,2) default 0,
  aliquota_cofins numeric(7,4) default 0,
  valor_cofins numeric(14,2) default 0,
  base_cbs numeric(14,2) default 0,
  aliquota_cbs numeric(7,4) default 0,
  valor_cbs numeric(14,2) default 0,
  base_ibs numeric(14,2) default 0,
  aliquota_ibs_estadual numeric(7,4) default 0,
  aliquota_ibs_municipal numeric(7,4) default 0,
  valor_ibs_estadual numeric(14,2) default 0,
  valor_ibs_municipal numeric(14,2) default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_nota_fiscal_itens_nota on public.nota_fiscal_itens (nota_fiscal_id);

-- ----------------------------------------------------------------------------
-- 7) cte_documentos — CT-e (frete)
-- ----------------------------------------------------------------------------
create table if not exists public.cte_documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  periodo_id uuid not null references public.periodos_apuracao(id) on delete cascade,
  -- nullable: lançamentos manuais (ver manual_entry_migration.sql) nem sempre têm chave de 44 dígitos
  chave_acesso text,
  tipo_cte text,
  numero_cte text,
  cfop text,
  natureza text,
  data_emissao date,
  status text,
  inicio_prestacao text,
  tomador_nome text,
  tomador_cnpj text,
  enderecos jsonb,
  valor_frete numeric(14,2) default 0,
  valor_recebido numeric(14,2) default 0,
  cst_icms text,
  base_icms numeric(14,2) default 0,
  percentual_icms numeric(7,4) default 0,
  valor_icms numeric(14,2) default 0,
  nfes_relacionadas text,
  alertas text,
  class_trib text,
  base_cbs numeric(14,2) default 0,
  aliquota_cbs numeric(7,4) default 0,
  valor_cbs numeric(14,2) default 0,
  base_ibs_estadual numeric(14,2) default 0,
  aliquota_ibs_estadual numeric(7,4) default 0,
  valor_ibs_estadual numeric(14,2) default 0,
  base_ibs_municipal numeric(14,2) default 0,
  aliquota_ibs_municipal numeric(7,4) default 0,
  valor_ibs_municipal numeric(14,2) default 0,
  import_batch_id uuid references public.import_batches(id),
  created_at timestamptz not null default now(),
  unique (empresa_id, chave_acesso)
);

create index if not exists idx_cte_documentos_periodo on public.cte_documentos (empresa_id, periodo_id);

-- ----------------------------------------------------------------------------
-- 8) snapshots de apuração — gravados só no momento do fechamento do período
-- ----------------------------------------------------------------------------
create table if not exists public.apuracao_icms_snapshot (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid not null unique references public.periodos_apuracao(id) on delete cascade,
  debito_saidas numeric(14,2) not null default 0,
  debito_estorno numeric(14,2) not null default 0,
  credito_devolucoes numeric(14,2) not null default 0,
  credito_nfe_entradas numeric(14,2) not null default 0,
  credito_cte numeric(14,2) not null default 0,
  credito_acumulado_anterior numeric(14,2) not null default 0,
  resultado numeric(14,2) not null default 0,
  saldo_credor_final numeric(14,2) not null default 0,
  gerado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.apuracao_pis_cofins_snapshot (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid not null unique references public.periodos_apuracao(id) on delete cascade,
  aliquota_pis_debito numeric(6,4) not null default 0,
  aliquota_pis_credito numeric(6,4) not null default 0,
  aliquota_cofins_debito numeric(6,4) not null default 0,
  aliquota_cofins_credito numeric(6,4) not null default 0,
  base_debito numeric(14,2) not null default 0,
  base_credito numeric(14,2) not null default 0,
  debito_pis numeric(14,2) not null default 0,
  credito_pis numeric(14,2) not null default 0,
  resultado_pis numeric(14,2) not null default 0,
  debito_cofins numeric(14,2) not null default 0,
  credito_cofins numeric(14,2) not null default 0,
  resultado_cofins numeric(14,2) not null default 0,
  gerado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- FIM do schema. Próximo passo: rls_and_auth_migration.sql
-- ============================================================================
