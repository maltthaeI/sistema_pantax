import { num, str, parseDataBr, direcaoDoCfop } from './shared';

// Planilha "Relatório Detalhado por Produto" (Emitidas/Recebidas): uma linha
// por nota+produto. Só extraímos o que o sistema efetivamente usa (telas de
// CFOP + apuração ICMS/PIS-COFINS, que usa Valor Total e Valor do ICMS/ICMS
// ST/IPI como base — não soma PIS/COFINS direto da planilha, ver
// AppContext.gerarApuracao) — datas do lançamento, dados do produto, CBS/IBS
// etc. não são lidos nem gravados. "_chaveAcesso" e "_dataEmissao" existem só
// para validar a linha e achar a competência do lote no import; nunca são
// persistidos (ver importarRelatorioNfe.js).
export function parseRelatorioNfeRows(rows) {
    return rows
        .map(row => {
            const cfop = str(row['CFOP']);
            const valorProduto = num(row['Valor do produto']);
            const frete = num(row['Frete']);
            const despesasAcessorias = num(row['Despesas acessórias']);
            const valorIcmsSt = num(row['Valor do ICMS ST']);
            const valorIpi = num(row['Valor do IPI']);
            const desconto = num(row['Desconto']);

            return {
                _chaveAcesso: str(row['Chave de Acesso Nota']),
                _dataEmissao: parseDataBr(row['Data de Emissão']),

                status: str(row['Status']),
                cfop,
                cfop_direcao: direcaoDoCfop(cfop),
                // Coluna pedida: soma de produto + frete + despesas acessórias + ICMS ST + IPI, menos desconto.
                valor_total: valorProduto + frete + despesasAcessorias + valorIcmsSt + valorIpi - desconto,
                valor_ipi: valorIpi,
                valor_icms: num(row['Valor do ICMS']),
                valor_icms_st: valorIcmsSt,
                valor_icms_uf_destino: num(row['Valor de ICMS para a UF de destino']),
            };
        })
        .filter(r => r._chaveAcesso && r.cfop);
}
