-- ============================================================================
-- Pantax Sistema — upload único de xlsx (relatório "Detalhado por Produto").
-- Rode este arquivo no SQL Editor do Supabase depois das migrations anteriores.
-- Substitui o fluxo de import separado (cte/emitidas/recebidas): cada linha da
-- planilha (nota + produto já vêm juntos na mesma linha) vira uma linha aqui,
-- com a coluna Valor Total calculada no momento da importação.
-- ============================================================================

alter table public.import_batches drop constraint if exists import_batches_tipo_arquivo_check;
alter table public.import_batches add constraint import_batches_tipo_arquivo_check
  check (tipo_arquivo in ('cte','emitidas','recebidas','nfe'));

create table if not exists public.nfe_linhas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete set null,

  -- identificação da nota (repetida em toda linha de produto da mesma nota na planilha)
  status text,
  data_emissao date,
  especie text,
  numero_nota text,
  serie text,
  tipo_operacao text,
  natureza_operacao text,
  chave_acesso text not null,
  emitente_cnpj text,
  uf_emitente text,
  destinatario_cnpj text,
  uf_destinatario text,
  transportadora_cnpj text,
  valor_contabil numeric(14,2) default 0,

  -- produto
  cod_produto text,
  descricao text,
  categoria text,
  ncm text,
  ean text,
  cest text,
  ex text,
  cfop text not null,
  cfop_direcao text not null check (cfop_direcao in ('entrada','saida')),
  origem text,
  cst text,
  csosn text,
  class_trib text,
  valor_produto numeric(14,2) default 0,
  quantidade numeric(14,4) default 0,
  unidade text,
  desconto numeric(14,2) default 0,
  frete numeric(14,2) default 0,
  despesas_acessorias numeric(14,2) default 0,
  -- coluna pedida: soma de produto + frete + despesas acessórias + ICMS ST + IPI - desconto
  valor_total numeric(14,2) not null default 0,

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

create index if not exists idx_nfe_linhas_empresa_status on public.nfe_linhas (empresa_id, status);
create index if not exists idx_nfe_linhas_empresa_cfop on public.nfe_linhas (empresa_id, cfop_direcao, cfop);
create index if not exists idx_nfe_linhas_batch on public.nfe_linhas (import_batch_id);

alter table public.nfe_linhas enable row level security;
drop policy if exists "nfe_linhas_all" on public.nfe_linhas;
create policy "nfe_linhas_all" on public.nfe_linhas for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- view de resumo: CFOPs das notas Autorizadas, agregados por empresa/direção.
-- security_invoker garante que a RLS de nfe_linhas seja aplicada com o papel
-- de quem consulta a view (sem isso, uma view roda com o papel de quem criou).
-- Agregado no banco em vez de trazer as ~18 mil linhas pro cliente.
-- ----------------------------------------------------------------------------
create or replace view public.nfe_resumo_cfop
  with (security_invoker = true) as
select
  empresa_id,
  cfop,
  cfop_direcao,
  count(*) as quantidade,
  sum(valor_total) as valor_total
from public.nfe_linhas
where status = 'Autorizada'
group by empresa_id, cfop, cfop_direcao;

grant select on public.nfe_resumo_cfop to authenticated;

-- ============================================================================
-- FIM. Tabelas antigas (notas_fiscais, nota_fiscal_itens, cte_documentos,
-- apuracao_*_snapshot) e o fluxo de 3 uploads seguem existindo no banco, só
-- não são mais usadas pela tela de importação — nada foi apagado.
-- ============================================================================
