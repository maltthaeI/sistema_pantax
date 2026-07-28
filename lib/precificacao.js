// Motor de cálculo do simulador de Precificação (Lucro Real) — reproduz
// fórmula a fórmula a planilha "102025 - Precificação LR" (aba Lucro Real).

// PIS/COFINS não-cumulativo (Lucro Real): 1,65% + 7,60%.
export const ALIQUOTA_PIS_COFINS_PADRAO = 0.0925;
// IRPJ 15% + adicional 10% já embutido (assume lucro mensal acima do limite
// de isenção do adicional) — CSLL padrão 9%. Ajustável na tela se necessário.
export const ALIQUOTA_IRPJ_PADRAO = 0.25;
export const ALIQUOTA_CSLL_PADRAO = 0.09;
export const ALIQUOTA_CREDITO_ICMS_FRETE_PADRAO = 0.10;
export const ALIQUOTA_DESPESA_OPERACAO_PADRAO = 0.005;

// Estado de origem padrão sugerido no formulário — o real vem do select
// "Empresa — Estado de Origem" na tela, pois cada empresa está numa UF diferente.
export const UF_ORIGEM_PADRAO = 'SP';

// Alíquotas internas de ICMS por estado — referência a conferir com o
// contador (mudam com frequência; alguns estados somam FCP por cima).
export const ESTADOS_ICMS = [
    { uf: 'AC', nome: 'Acre', regiao: 'Norte', aliquotaInterna: 0.19 },
    { uf: 'AL', nome: 'Alagoas', regiao: 'Nordeste', aliquotaInterna: 0.19 },
    { uf: 'AP', nome: 'Amapá', regiao: 'Norte', aliquotaInterna: 0.18 },
    { uf: 'AM', nome: 'Amazonas', regiao: 'Norte', aliquotaInterna: 0.20 },
    { uf: 'BA', nome: 'Bahia', regiao: 'Nordeste', aliquotaInterna: 0.19 },
    { uf: 'CE', nome: 'Ceará', regiao: 'Nordeste', aliquotaInterna: 0.20 },
    { uf: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste', aliquotaInterna: 0.20 },
    { uf: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste', aliquotaInterna: 0.17 },
    { uf: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste', aliquotaInterna: 0.19 },
    { uf: 'MA', nome: 'Maranhão', regiao: 'Nordeste', aliquotaInterna: 0.22 },
    { uf: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste', aliquotaInterna: 0.17 },
    { uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', aliquotaInterna: 0.17 },
    { uf: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste', aliquotaInterna: 0.18 },
    { uf: 'PA', nome: 'Pará', regiao: 'Norte', aliquotaInterna: 0.19 },
    { uf: 'PB', nome: 'Paraíba', regiao: 'Nordeste', aliquotaInterna: 0.20 },
    { uf: 'PR', nome: 'Paraná', regiao: 'Sul', aliquotaInterna: 0.195 },
    { uf: 'PE', nome: 'Pernambuco', regiao: 'Nordeste', aliquotaInterna: 0.205 },
    { uf: 'PI', nome: 'Piauí', regiao: 'Nordeste', aliquotaInterna: 0.21 },
    { uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste', aliquotaInterna: 0.20 },
    { uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste', aliquotaInterna: 0.18 },
    { uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul', aliquotaInterna: 0.17 },
    { uf: 'RO', nome: 'Rondônia', regiao: 'Norte', aliquotaInterna: 0.195 },
    { uf: 'RR', nome: 'Roraima', regiao: 'Norte', aliquotaInterna: 0.20 },
    { uf: 'SC', nome: 'Santa Catarina', regiao: 'Sul', aliquotaInterna: 0.17 },
    { uf: 'SP', nome: 'São Paulo', regiao: 'Sudeste', aliquotaInterna: 0.18 },
    { uf: 'SE', nome: 'Sergipe', regiao: 'Nordeste', aliquotaInterna: 0.19 },
    { uf: 'TO', nome: 'Tocantins', regiao: 'Norte', aliquotaInterna: 0.20 },
];

export const estadoIcms = (uf) => ESTADOS_ICMS.find(e => e.uf === uf) || ESTADOS_ICMS.find(e => e.uf === UF_ORIGEM_PADRAO);

const REGIOES_SEMPRE_DOZE = ['Norte', 'Nordeste', 'Centro-Oeste'];

// Regra do Senado (Resolução 22/89, com os ajustes posteriores):
// - Origem em Sul/Sudeste (exceto ES): 7% se o destino for Norte/Nordeste/
//   Centro-Oeste/ES; 12% se o destino for Sul/Sudeste (exceto ES).
// - Origem em Norte/Nordeste/Centro-Oeste/ES: sempre 12%, pra qualquer destino.
// - Produto importado (ou nacional c/ conteúdo de importação ≥40%): 4% fixo,
//   qualquer UF de origem/destino (Resolução do Senado 13/2012).
// Dentro do próprio estado (origem === destino) não há DIFAL, só a alíquota interna.
export function calcularIcmsVenda({ origemUf, destinoUf, produtoImportado = false, aliquotaInternaDestino }) {
    if (destinoUf === origemUf) {
        return { aliquota: aliquotaInternaDestino, difal: 0 };
    }
    if (produtoImportado) {
        return { aliquota: 0.04, difal: Math.max(aliquotaInternaDestino - 0.04, 0) };
    }
    const origem = estadoIcms(origemUf);
    const origemSempreDoze = REGIOES_SEMPRE_DOZE.includes(origem.regiao) || origem.uf === 'ES';
    let aliquota;
    if (origemSempreDoze) {
        aliquota = 0.12;
    } else {
        const destino = estadoIcms(destinoUf);
        const destinoUsaSete = REGIOES_SEMPRE_DOZE.includes(destino.regiao) || destino.uf === 'ES';
        aliquota = destinoUsaSete ? 0.07 : 0.12;
    }
    return { aliquota, difal: Math.max(aliquotaInternaDestino - aliquota, 0) };
}

// Compra: só interessa se o produto é nacional ou importado — a alíquota
// fica editável na tela (pode ajustar pelo que veio destacado na nota do fornecedor).
export const CENARIOS_ICMS_COMPRA = [
    { key: 'nacional', label: 'Nacional', aliquota: 0.18 },
    { key: 'importado', label: 'Importado', aliquota: 0.04 },
];

export const cenarioIcmsCompra = (key) => CENARIOS_ICMS_COMPRA.find(c => c.key === key) || CENARIOS_ICMS_COMPRA[0];

export function calcularPrecificacao(input) {
    const {
        precoVenda = 0,
        precoCompra = 0,
        aliquotaIcmsVenda = 0,
        aliquotaIcmsDifalVenda = 0,
        aliquotaIcmsCompra = 0,
        pagaDifal = true,
        taxaComissao = 0,
        rebate = 0,
        taxaPedido = 0,
        frete = 0,
        ads = 0,
        aliquotaCreditoIcmsFrete = ALIQUOTA_CREDITO_ICMS_FRETE_PADRAO,
        aliquotaDespesaOperacao = ALIQUOTA_DESPESA_OPERACAO_PADRAO,
        aliquotaIrpj = ALIQUOTA_IRPJ_PADRAO,
        aliquotaCsll = ALIQUOTA_CSLL_PADRAO,
        aliquotaPisCofins = ALIQUOTA_PIS_COFINS_PADRAO,
    } = input;

    // ---- Apuração Contábil ----
    const icmsVenda = precoVenda * aliquotaIcmsVenda;
    const icmsDifalVenda = precoVenda * aliquotaIcmsDifalVenda;
    // Base do PIS/COFINS exclui o ICMS (tese do século — STF) e o DIFAL (mesma natureza).
    const pisCofinsVenda = (precoVenda - icmsVenda - icmsDifalVenda) * aliquotaPisCofins;
    const totalImpostosVenda = icmsVenda + icmsDifalVenda + pisCofinsVenda;
    const receitaLiquidaVenda = precoVenda - totalImpostosVenda;

    const icmsCompraCredito = precoCompra * aliquotaIcmsCompra;
    const pisCofinsCompraCredito = (precoCompra - icmsCompraCredito) * aliquotaPisCofins;
    const totalCredito = icmsCompraCredito + pisCofinsCompraCredito;
    const cmv = precoCompra - totalCredito;
    const lucroBruto = receitaLiquidaVenda - cmv;

    const despesaComissao = (precoVenda * taxaComissao) - rebate;
    const despesasVendas = despesaComissao + taxaPedido + frete + ads;
    const creditoPisCofinsDespesas = despesasVendas * aliquotaPisCofins;
    const creditoIcmsFrete = frete * aliquotaCreditoIcmsFrete;

    const lucroLiquidoOperacional = lucroBruto - despesasVendas;
    const despesaOperacao = precoVenda * aliquotaDespesaOperacao;
    const baseIrpjCsll = lucroLiquidoOperacional - despesaOperacao;

    const valorIrpj = baseIrpjCsll * aliquotaIrpj;
    const valorCsll = baseIrpjCsll * aliquotaCsll;
    const totalImpostosLucro = valorIrpj + valorCsll;
    const lucroLiquidoContabil = baseIrpjCsll - totalImpostosLucro;
    const margemLiquidaContabil = precoVenda ? lucroLiquidoContabil / precoVenda : 0;

    // ---- Apuração de Impostos (ICMS/PIS/COFINS a recolher) ----
    const saldoIcms = icmsVenda - icmsCompraCredito - creditoIcmsFrete;
    const saldoPisCofins = pisCofinsVenda - pisCofinsCompraCredito - creditoPisCofinsDespesas;
    const totalIcmsPisCofins = (saldoIcms > 0 ? saldoIcms : 0) + saldoPisCofins;
    const totalImpostos = pagaDifal ? icmsDifalVenda + totalIcmsPisCofins : totalIcmsPisCofins;

    // ---- Apuração Financeira ----
    const margemContribuicao = precoVenda - precoCompra - totalImpostos - despesasVendas;
    const margemContribuicaoPct = precoVenda ? margemContribuicao / precoVenda : 0;
    const totalImpostosAPagar = valorCsll + valorIrpj + totalImpostos;
    const aliquotaFinalImpostos = precoVenda ? totalImpostosAPagar / precoVenda : 0;
    const lucroLiquidoFinanceiro = margemContribuicao - valorIrpj - valorCsll;
    const margemLiquidaFinanceira = precoVenda ? lucroLiquidoFinanceiro / precoVenda : 0;

    return {
        contabil: {
            icmsVenda, icmsDifalVenda, pisCofinsVenda, totalImpostosVenda, receitaLiquidaVenda,
            icmsCompraCredito, pisCofinsCompraCredito, totalCredito, cmv, lucroBruto,
            despesaComissao, despesasVendas, creditoPisCofinsDespesas, creditoIcmsFrete,
            lucroLiquidoOperacional, despesaOperacao, baseIrpjCsll,
            valorIrpj, valorCsll, totalImpostosLucro, lucroLiquidoContabil, margemLiquidaContabil,
        },
        impostos: {
            icmsVenda, icmsCompraCredito, creditoIcmsFrete, saldoIcms,
            totalDifal: icmsDifalVenda, pisCofinsVenda, pisCofinsCompraCredito, creditoPisCofinsDespesas,
            saldoPisCofins, totalIcmsPisCofins, totalImpostos,
        },
        financeiro: {
            precoVenda, precoCompra, totalImpostos, despesasVendas,
            margemContribuicao, margemContribuicaoPct,
            valorIrpj, valorCsll, totalImpostosAPagar, aliquotaFinalImpostos,
            lucroLiquidoFinanceiro, margemLiquidaFinanceira,
        },
    };
}
