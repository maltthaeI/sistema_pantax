-- ============================================================================
-- Pantax Sistema — funções de apuração fiscal (ICMS / PIS-COFINS).
-- Rode depois de schema_migration.sql e rls_and_auth_migration.sql.
--
-- Fórmulas reverse-engineered da planilha "Grand Variety - Previa.xlsx",
-- cruzadas número a número contra as outras 3 planilhas de origem.
-- Ver plano em C:\Users\Murilo\.claude\plans\rosy-percolating-hennessy.md
-- para a dedução completa.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- calcular_apuracao_icms
--
-- Débito  = Saídas NF-e (ICMS) + Estorno de Débito (manual)
-- Crédito = Devoluções (NF-e emitida/Entrada) + NF-e Entradas (recebidas)
--         + CT-e + Acumulado do período anterior
-- Resultado = Débito − Crédito (positivo = a pagar; negativo = saldo credor)
-- ----------------------------------------------------------------------------
create or replace function public.calcular_apuracao_icms(p_periodo_id uuid)
returns table (
  debito_saidas numeric,
  debito_estorno numeric,
  total_debitos numeric,
  credito_devolucoes numeric,
  credito_nfe_entradas numeric,
  credito_cte numeric,
  credito_acumulado_anterior numeric,
  total_creditos numeric,
  resultado numeric,
  saldo_credor_final numeric
)
language sql
stable
as $$
  with periodo as (
    select id, empresa_id, estorno_debito_manual, credito_icms_acumulado_anterior
    from public.periodos_apuracao
    where id = p_periodo_id
  ),
  saidas as (
    select coalesce(sum(valor_icms), 0) as v
    from public.notas_fiscais
    where periodo_id = p_periodo_id and direcao = 'emitida' and tipo_operacao = 'Saida'
  ),
  devolucoes as (
    select coalesce(sum(valor_icms), 0) as v
    from public.notas_fiscais
    where periodo_id = p_periodo_id and direcao = 'emitida' and tipo_operacao = 'Entrada'
  ),
  entradas as (
    select coalesce(sum(valor_icms), 0) as v
    from public.notas_fiscais
    where periodo_id = p_periodo_id and direcao = 'recebida'
  ),
  cte as (
    select coalesce(sum(valor_icms), 0) as v
    from public.cte_documentos
    where periodo_id = p_periodo_id
  ),
  calculo as (
    select
      saidas.v as debito_saidas,
      periodo.estorno_debito_manual as debito_estorno,
      devolucoes.v as credito_devolucoes,
      entradas.v as credito_nfe_entradas,
      cte.v as credito_cte,
      periodo.credito_icms_acumulado_anterior as credito_acumulado_anterior
    from periodo, saidas, devolucoes, entradas, cte
  )
  select
    debito_saidas,
    debito_estorno,
    (debito_saidas + debito_estorno) as total_debitos,
    credito_devolucoes,
    credito_nfe_entradas,
    credito_cte,
    credito_acumulado_anterior,
    (credito_devolucoes + credito_nfe_entradas + credito_cte + credito_acumulado_anterior) as total_creditos,
    (debito_saidas + debito_estorno) - (credito_devolucoes + credito_nfe_entradas + credito_cte + credito_acumulado_anterior) as resultado,
    greatest(
      (credito_devolucoes + credito_nfe_entradas + credito_cte + credito_acumulado_anterior) - (debito_saidas + debito_estorno),
      0
    ) as saldo_credor_final
  from calculo;
$$;

grant execute on function public.calcular_apuracao_icms(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- calcular_apuracao_pis_cofins
--
-- Alíquotas configuráveis por empresa (nunca hardcoded).
-- Base Débito  = Saídas NF-e (Valor contábil − ICMS)
-- Base Crédito = [Recebidas (Valor contábil − ICMS − ICMS-ST − IPI)]
--              + [CT-e (Frete − ICMS)]
--              + [NF-e emitida/Entrada, i.e. devoluções (Valor contábil − ICMS)]
-- ----------------------------------------------------------------------------
create or replace function public.calcular_apuracao_pis_cofins(p_periodo_id uuid)
returns table (
  aliquota_pis_debito numeric,
  aliquota_pis_credito numeric,
  aliquota_cofins_debito numeric,
  aliquota_cofins_credito numeric,
  base_debito numeric,
  base_credito numeric,
  debito_pis numeric,
  credito_pis numeric,
  resultado_pis numeric,
  debito_cofins numeric,
  credito_cofins numeric,
  resultado_cofins numeric
)
language sql
stable
as $$
  with periodo as (
    select p.id, p.empresa_id, e.aliquota_pis_debito, e.aliquota_pis_credito,
           e.aliquota_cofins_debito, e.aliquota_cofins_credito
    from public.periodos_apuracao p
    join public.empresas e on e.id = p.empresa_id
    where p.id = p_periodo_id
  ),
  saidas as (
    select coalesce(sum(valor_contabil), 0) - coalesce(sum(valor_icms), 0) as base
    from public.notas_fiscais
    where periodo_id = p_periodo_id and direcao = 'emitida' and tipo_operacao = 'Saida'
  ),
  recebidas as (
    select coalesce(sum(valor_contabil), 0) - coalesce(sum(valor_icms), 0) - coalesce(sum(valor_st), 0) - coalesce(sum(valor_ipi), 0) as base
    from public.notas_fiscais
    where periodo_id = p_periodo_id and direcao = 'recebida'
  ),
  cte as (
    select coalesce(sum(valor_frete), 0) - coalesce(sum(valor_icms), 0) as base
    from public.cte_documentos
    where periodo_id = p_periodo_id
  ),
  devolucoes as (
    select coalesce(sum(valor_contabil), 0) - coalesce(sum(valor_icms), 0) as base
    from public.notas_fiscais
    where periodo_id = p_periodo_id and direcao = 'emitida' and tipo_operacao = 'Entrada'
  ),
  calculo as (
    select
      periodo.aliquota_pis_debito,
      periodo.aliquota_pis_credito,
      periodo.aliquota_cofins_debito,
      periodo.aliquota_cofins_credito,
      saidas.base as base_debito,
      (recebidas.base + cte.base + devolucoes.base) as base_credito
    from periodo, saidas, recebidas, cte, devolucoes
  )
  select
    aliquota_pis_debito,
    aliquota_pis_credito,
    aliquota_cofins_debito,
    aliquota_cofins_credito,
    base_debito,
    base_credito,
    (base_debito * aliquota_pis_debito) as debito_pis,
    (base_credito * aliquota_pis_credito) as credito_pis,
    (base_debito * aliquota_pis_debito) - (base_credito * aliquota_pis_credito) as resultado_pis,
    (base_debito * aliquota_cofins_debito) as debito_cofins,
    (base_credito * aliquota_cofins_credito) as credito_cofins,
    (base_debito * aliquota_cofins_debito) - (base_credito * aliquota_cofins_credito) as resultado_cofins
  from calculo;
$$;

grant execute on function public.calcular_apuracao_pis_cofins(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- detalhar_notas_por_tipo_operacao — drill-down por direção/tipo de operação
-- (as mesmas fatias usadas nas fórmulas de débito/crédito acima), usado nas
-- telas de apuração para o contador conferir os totais que compõem cada linha.
-- ----------------------------------------------------------------------------
create or replace function public.detalhar_notas_por_tipo_operacao(p_periodo_id uuid, p_direcao text)
returns table (
  tipo_operacao text,
  valor_contabil numeric,
  valor_icms numeric,
  valor_st numeric,
  valor_ipi numeric,
  qtd_notas bigint
)
language sql
stable
as $$
  select
    tipo_operacao,
    coalesce(sum(valor_contabil), 0),
    coalesce(sum(valor_icms), 0),
    coalesce(sum(valor_st), 0),
    coalesce(sum(valor_ipi), 0),
    count(*)
  from public.notas_fiscais
  where periodo_id = p_periodo_id
    and direcao = p_direcao
  group by tipo_operacao;
$$;

grant execute on function public.detalhar_notas_por_tipo_operacao(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- detalhar_itens_por_cfop — drill-down agrupado por CFOP (equivalente à aba
-- RESUMO da planilha original, que é construída a partir do relatório por
-- produto — CFOP só existe em nível de item, não de nota).
-- ----------------------------------------------------------------------------
create or replace function public.detalhar_itens_por_cfop(p_periodo_id uuid, p_direcao text)
returns table (
  cfop text,
  valor_total numeric,
  valor_icms numeric,
  valor_icms_st numeric,
  valor_ipi numeric,
  qtd_itens bigint
)
language sql
stable
as $$
  select
    i.cfop,
    coalesce(sum(i.valor_total), 0),
    coalesce(sum(i.valor_icms), 0),
    coalesce(sum(i.valor_icms_st), 0),
    coalesce(sum(i.valor_ipi), 0),
    count(*)
  from public.nota_fiscal_itens i
  join public.notas_fiscais n on n.id = i.nota_fiscal_id
  where n.periodo_id = p_periodo_id
    and n.direcao = p_direcao
  group by i.cfop
  order by coalesce(sum(i.valor_total), 0) desc;
$$;

grant execute on function public.detalhar_itens_por_cfop(uuid, text) to authenticated;

-- ============================================================================
-- FIM. Verificação: rodar select * from calcular_apuracao_icms('<periodo_id>')
-- e comparar com Grand Variety - Previa.xlsx.
-- ============================================================================
