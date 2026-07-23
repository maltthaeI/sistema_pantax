-- ============================================================================
-- Pantax Sistema — nfe_linhas só guarda o que o sistema realmente usa hoje
-- (tela Resumo + contagem do Dashboard): status, CFOP/direção, Valor Total e
-- os 4 valores de imposto exibidos. Tudo que vem da planilha e não é lido em
-- nenhuma tela (datas, dados do produto, chave de acesso, PIS/COFINS,
-- CBS/IBS, etc.) é descartado — se precisar de novo, basta reimportar a
-- planilha, que ela é a fonte da verdade.
-- Rode depois de limpeza_schema_antigo_migration.sql.
-- ============================================================================

alter table public.nfe_linhas
  drop column if exists data_emissao,
  drop column if exists especie,
  drop column if exists numero_nota,
  drop column if exists serie,
  drop column if exists tipo_operacao,
  drop column if exists natureza_operacao,
  drop column if exists chave_acesso,
  drop column if exists emitente_cnpj,
  drop column if exists uf_emitente,
  drop column if exists destinatario_cnpj,
  drop column if exists uf_destinatario,
  drop column if exists transportadora_cnpj,
  drop column if exists valor_contabil,
  drop column if exists cod_produto,
  drop column if exists descricao,
  drop column if exists categoria,
  drop column if exists ncm,
  drop column if exists ean,
  drop column if exists cest,
  drop column if exists ex,
  drop column if exists origem,
  drop column if exists cst,
  drop column if exists csosn,
  drop column if exists class_trib,
  drop column if exists valor_produto,
  drop column if exists quantidade,
  drop column if exists unidade,
  drop column if exists desconto,
  drop column if exists frete,
  drop column if exists despesas_acessorias,
  drop column if exists base_icms,
  drop column if exists aliquota_icms,
  drop column if exists aliquota_icms_sn,
  drop column if exists valor_icms_sn,
  drop column if exists base_icms_st,
  drop column if exists aliquota_icms_st,
  drop column if exists icms_retido,
  drop column if exists cst_ipi,
  drop column if exists base_ipi,
  drop column if exists aliquota_ipi,
  drop column if exists cst_pis,
  drop column if exists base_pis,
  drop column if exists aliquota_pis,
  drop column if exists valor_pis,
  drop column if exists cst_cofins,
  drop column if exists base_cofins,
  drop column if exists aliquota_cofins,
  drop column if exists valor_cofins,
  drop column if exists base_cbs,
  drop column if exists aliquota_cbs,
  drop column if exists valor_cbs,
  drop column if exists base_ibs,
  drop column if exists aliquota_ibs_estadual,
  drop column if exists aliquota_ibs_municipal,
  drop column if exists valor_ibs_estadual,
  drop column if exists valor_ibs_municipal;

-- ============================================================================
-- FIM. Colunas que sobram em nfe_linhas: id, empresa_id, import_batch_id,
-- ano, mes, tipo_calculo, status, cfop, cfop_direcao, valor_total, valor_ipi,
-- valor_icms, valor_icms_st, valor_icms_uf_destino, created_at.
-- ============================================================================
