import { num, str, parseDataBr, direcaoDoCfop } from './shared';

// Planilha de CT-e tem estrutura própria — sem Valor do produto, ICMS ST,
// IPI, Categoria ou PIS/COFINS. "Valor do Frete" faz o papel de Valor Total
// pra fins de apuração (ver ResumoCfopTab: coluna exibida é "Valor do Frete").
export function parseCteRows(rows) {
    return rows
        .map(row => {
            const cfop = str(row['CFOP']);
            return {
                _chaveAcesso: str(row['Chave de Acesso Nota']),
                _dataEmissao: parseDataBr(row['Data de Emissão']),

                status: str(row['Status']),
                cfop,
                cfop_direcao: direcaoDoCfop(cfop),
                categoria: null,
                valor_total: num(row['Valor do Frete']),
                valor_ipi: 0,
                valor_icms: num(row['Valor do ICMS']),
                valor_icms_st: 0,
                valor_icms_uf_destino: 0,
                valor_icms_simples_nacional: 0,
            };
        })
        .filter(r => r._chaveAcesso && r.cfop);
}
