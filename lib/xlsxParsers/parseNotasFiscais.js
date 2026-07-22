import { num, str, parseDataBr } from './shared';

// Linhas cruas da aba "Relatório Detalhado por Nota" (Emitidas ou Recebidas).
export function parseNotasFiscaisHeaderRows(rows, direcao) {
    return rows
        .map(row => ({
            direcao,
            tipo_operacao: str(row['Tipo de operação']),
            chave_acesso: str(row['Chave de Acesso Nota']),
            status: str(row['Status']),
            data_emissao: parseDataBr(row['Data de Emissão']),
            especie: str(row['Espécie']),
            numero_nota: str(row['Número Nota']),
            serie: str(row['Série da nota']),
            natureza_operacao: str(row['Natureza da Operação']),
            emitente_nome: str(row['Emitente']),
            emitente_cnpj: str(row['CNPJ/CPF - Emitente']),
            destinatario_nome: str(row['Destinatário']),
            destinatario_cnpj: str(row['CNPJ/CPF - Destinatário']),
            transportadora_nome: str(row['Nome da Transpotadora']),
            transportadora_cnpj: str(row['CNPJ/CPF - Transportadora']),
            uf: str(row['UF - Emitente']) || str(row['UF - Destinatário']) || null,
            valor_contabil: num(row['Valor contábil']),
            base_icms: num(row['Base de ICMS']),
            valor_icms: num(row['Valor do ICMS']),
            valor_pis: num(row['Valor do PIS']),
            valor_cofins: num(row['Valor do COFINS']),
            valor_cbs: num(row['Valor CBS']),
            valor_ibs_estadual: num(row['Valor IBS Estadual']),
            valor_ibs_municipal: num(row['Valor IBS Municipal']),
            valor_ipi: num(row['Valor do IPI']),
            valor_st: num(row['Valor S.T.']),
            valor_fcp_uf_destino: num(row['Valor do FCP da UF de destino']),
            valor_icms_uf_destino: num(row['Valor de ICMS para a UF de destino']),
            fcp_st: num(row['FCP S.T.']),
            // Coluna só existe na planilha de Recebidas; undefined nas outras vira null.
            manifestacao: direcao === 'recebida' ? str(row['Manisfestação']) : null,
            descricao: str(row['Descrição']),
            alertas: str(row['Alertas']),
        }))
        .filter(r => r.chave_acesso);
}

// Linhas cruas da aba "Relatório Detalhado por Produto" (Emitidas ou Recebidas).
// Cada linha carrega a "Chave de Acesso Nota" para linkar de volta à nota —
// o route handler resolve isso para nota_fiscal_id antes de inserir.
export function parseNotaFiscalItemRows(rows) {
    return rows
        .map(row => ({
            chave_acesso: str(row['Chave de Acesso Nota']),
            cod_produto: str(row['Cód. prod.']),
            descricao: str(row['Descrição']),
            categoria: str(row['Categoria']),
            ncm: str(row['NCM']),
            ean: str(row['EAN']),
            cest: str(row['CEST']),
            ex: str(row['EX']),
            cfop: str(row['CFOP']),
            origem: str(row['Origem']),
            cst: str(row['CST']),
            csosn: str(row['CSOSN']),
            class_trib: str(row['ClassTrib']),
            valor_produto: num(row['Valor do produto']),
            valor_total: num(row['VALOR TOTAL']),
            quantidade: num(row['Quantidade']),
            unidade: str(row['Unidade']),
            desconto: num(row['Desconto']),
            frete: num(row['Frete']),
            despesas_acessorias: num(row['Despesas acessórias']),
            base_icms: num(row['Base de ICMS']),
            aliquota_icms: num(row['Alíquota de ICMS']),
            valor_icms: num(row['Valor do ICMS']),
            aliquota_icms_sn: num(row['Alíquota de ICMS Simples Nacional']),
            valor_icms_sn: num(row['Valor do ICMS Simples Nacional']),
            base_icms_st: num(row['Base de ICMS ST']),
            aliquota_icms_st: num(row['Alíquota do ICMS ST']),
            valor_icms_st: num(row['Valor do ICMS ST']),
            icms_retido: num(row['ICMS Retido']),
            valor_icms_uf_destino: num(row['Valor de ICMS para a UF de destino']),
            cst_ipi: str(row['CST IPI']),
            base_ipi: num(row['Base de IPI']),
            aliquota_ipi: num(row['Alíquota de IPI']),
            valor_ipi: num(row['Valor do IPI']),
            cst_pis: str(row['CST PIS']),
            base_pis: num(row['Base de PIS']),
            aliquota_pis: num(row['Alíquota de PIS']),
            valor_pis: num(row['Valor do PIS']),
            cst_cofins: str(row['CST COFINS']),
            base_cofins: num(row['Base de COFINS']),
            aliquota_cofins: num(row['Alíquota de COFINS']),
            valor_cofins: num(row['Valor do COFINS']),
            base_cbs: num(row['Base de CBS']),
            aliquota_cbs: num(row['Alíquota de CBS']),
            valor_cbs: num(row['Valor do CBS']),
            base_ibs: num(row['Base de IBS']),
            aliquota_ibs_estadual: num(row['Alíquota de IBS Estadual']),
            aliquota_ibs_municipal: num(row['Alíquota de IBS Municipal']),
            valor_ibs_estadual: num(row['Valor do IBS Estadual']),
            valor_ibs_municipal: num(row['Valor do IBS Municipal']),
        }))
        .filter(r => r.chave_acesso);
}
