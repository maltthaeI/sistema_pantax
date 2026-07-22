import { num, str, parseDataBr } from './shared';

function bloco(row, prefixo, extras = {}) {
    return {
        cnpj: str(row[`CPF/CNPJ ${prefixo}`]),
        ie: str(row[`IE ${prefixo}`]),
        nome: str(row[`Nome ${prefixo}`]),
        logradouro: str(row[`Logradouro ${prefixo}`]),
        numero: str(row[`Número ${prefixo}`]),
        complemento: str(row[`Complemento ${prefixo}`]),
        bairro: str(row[`Bairro ${prefixo}`]),
        cod_municipio: str(row[`Cód.Munícipio ${prefixo}`]),
        municipio: str(row[`Município ${prefixo}`]),
        cep: str(row[`CEP ${prefixo}`]),
        uf: str(row[`UF ${prefixo}`]),
        ...extras,
    };
}

// Linhas cruas do SheetJS (sheet_to_json) da única aba de dados do Cte.xlsx.
export function parseCteRows(rows) {
    return rows
        .map(row => ({
            chave_acesso: str(row['Chave de Acesso Nota']),
            tipo_cte: str(row['Tipo CT-e']),
            numero_cte: str(row['Nº CTe.']),
            cfop: str(row['CFOP']),
            natureza: str(row['Natureza']),
            data_emissao: parseDataBr(row['Data de Emissão']),
            status: str(row['Status']),
            inicio_prestacao: str(row['Início da Prestação']),
            tomador_nome: str(row['Nome Tomador']),
            tomador_cnpj: str(row['CNPJ Tomador']),
            enderecos: {
                emitente: bloco(row, 'Emitente'),
                remetente: bloco(row, 'Remetente', { codigo_pais: str(row['Código País Remetente']), pais: str(row['País Remetente']) }),
                destinatario: bloco(row, 'Destinatário', { codigo_pais: str(row['Código País Destinatário']), pais: str(row['País Remetente Destinatário']) }),
                recebedor: bloco(row, 'Recebedor', { codigo_pais: str(row['Código País Recebedor']), pais: str(row['País Remetente Recebedor']) }),
            },
            valor_frete: num(row['Valor do Frete']),
            valor_recebido: num(row['Valor recebido']),
            cst_icms: str(row['CST ICMS']),
            base_icms: num(row['Base Calculo ICMS']),
            percentual_icms: num(row['Percentual ICMS']),
            valor_icms: num(row['Valor do ICMS']),
            nfes_relacionadas: str(row['NFEs relacionadas']),
            alertas: str(row['Alertas']),
            class_trib: str(row['ClassTrib']),
            base_cbs: num(row['Base de CBS']),
            aliquota_cbs: num(row['Alíquota de CBS']),
            valor_cbs: num(row['Valor do CBS']),
            base_ibs_estadual: num(row['Base de IBS']),
            aliquota_ibs_estadual: num(row['Alíquota de IBS Estadual']),
            valor_ibs_estadual: num(row['Valor do IBS Estadual']),
            base_ibs_municipal: num(row['Base de IBS']),
            aliquota_ibs_municipal: num(row['Alíquota de IBS Municipal']),
            valor_ibs_municipal: num(row['Valor do IBS Municipal']),
        }))
        .filter(r => r.chave_acesso);
}
