import * as XLSX from 'xlsx';
import { parseRelatorioNfeRows } from './parseRelatorioNfe';
import { parseCteRows } from './parseCte';
import { insertEmLotes } from './shared';

const ABA_RELATORIO_NFE = 'Relatório Detalhado por Produto';
const ABA_CTE = 'Sheet1';
const ORIGENS = ['emitidas', 'recebidas', 'cte'];
const CAMPOS_SOMADOS = ['valor_total', 'valor_ipi', 'valor_icms', 'valor_icms_st', 'valor_icms_uf_destino'];

// A planilha não diz o mês a que se refere — é inferido pela data de emissão
// mais frequente entre as notas dos 3 arquivos (a maioria cai no mesmo mês;
// datas avulsas de virada de mês não devem "vencer" a competência do lote).
function competenciaDoLote(registros) {
    const contagem = new Map();
    for (const r of registros) {
        if (!r._dataEmissao) continue;
        const chave = r._dataEmissao.slice(0, 7); // "AAAA-MM"
        contagem.set(chave, (contagem.get(chave) || 0) + 1);
    }
    let chaveMaisFrequente = null;
    let maiorContagem = 0;
    for (const [chave, qtd] of contagem) {
        if (qtd > maiorContagem) { maiorContagem = qtd; chaveMaisFrequente = chave; }
    }
    if (!chaveMaisFrequente) throw new Error('Nenhuma linha com Data de Emissão válida encontrada nas planilhas.');
    const [ano, mes] = chaveMaisFrequente.split('-').map(Number);
    return { ano, mes };
}

// As telas de Emitidas/Recebidas/CT-e só mostram dados agregados por CFOP das
// notas Autorizadas — não há motivo pra gravar uma linha por item da planilha.
function agregarPorCfop(registros) {
    const grupos = new Map();
    for (const r of registros) {
        if (r.status !== 'Autorizada') continue;
        const chave = `${r.cfop_direcao}:${r.cfop}`;
        if (!grupos.has(chave)) {
            grupos.set(chave, { cfop: r.cfop, cfop_direcao: r.cfop_direcao, quantidade: 0, valor_total: 0, valor_ipi: 0, valor_icms: 0, valor_icms_st: 0, valor_icms_uf_destino: 0 });
        }
        const grupo = grupos.get(chave);
        grupo.quantidade += 1;
        for (const campo of CAMPOS_SOMADOS) grupo[campo] += r[campo];
    }
    return [...grupos.values()];
}

// CT-e tem estrutura própria (aba "Sheet1"); Emitidas/Recebidas usam o
// "Relatório Detalhado por Produto".
function lerRegistrosDoArquivo(buffer, tipo) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (tipo === 'cte') {
        if (!workbook.SheetNames.includes(ABA_CTE)) {
            throw new Error(`Planilha de CT-e não tem a aba esperada ("${ABA_CTE}"). Abas encontradas: ${workbook.SheetNames.join(', ')}`);
        }
        const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[ABA_CTE], { defval: null });
        return { linhas, registros: parseCteRows(linhas) };
    }
    if (!workbook.SheetNames.includes(ABA_RELATORIO_NFE)) {
        throw new Error(`Planilha de ${tipo} não tem a aba esperada ("${ABA_RELATORIO_NFE}"). Abas encontradas: ${workbook.SheetNames.join(', ')}`);
    }
    const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[ABA_RELATORIO_NFE], { defval: null });
    return { linhas, registros: parseRelatorioNfeRows(linhas) };
}

// Recebe as 3 planilhas (Emitidas, Recebidas, CT-e) e agrega CADA UMA
// separadamente por CFOP (origem vira 3 telas independentes, não uma combinada).
export async function importarRelatorioNfe(admin, { empresaId, arquivos, batchId, tipoCalculo }) {
    let totalLinhas = 0;
    let todosRegistros = [];
    const registrosPorOrigem = {};
    for (const { tipo, buffer } of arquivos) {
        const lido = lerRegistrosDoArquivo(buffer, tipo);
        totalLinhas += lido.linhas.length;
        registrosPorOrigem[tipo] = lido.registros;
        todosRegistros = todosRegistros.concat(lido.registros);
    }
    if (todosRegistros.length === 0) throw new Error('Nenhuma linha com Chave de Acesso e CFOP encontrada nas planilhas.');

    const { ano, mes } = competenciaDoLote(todosRegistros);
    const itensAutorizados = todosRegistros.filter(r => r.status === 'Autorizada').length;
    const itensCancelados = todosRegistros.filter(r => r.status === 'Cancelada').length;

    // Prévia e Fechamento do mesmo mês convivem — só substitui a versão anterior
    // da mesma competência + tipo (reimportar não duplica linhas).
    const { error: erroLimpeza } = await admin.from('nfe_resumo_cfop').delete()
        .eq('empresa_id', empresaId).eq('ano', ano).eq('mes', mes).eq('tipo_calculo', tipoCalculo);
    if (erroLimpeza) throw new Error('Falha ao limpar importação anterior desta competência: ' + erroLimpeza.message);

    let paraGravar = [];
    for (const origem of ORIGENS) {
        const agregados = agregarPorCfop(registrosPorOrigem[origem] || []);
        paraGravar = paraGravar.concat(agregados.map(a => ({
            ...a, origem, empresa_id: empresaId, import_batch_id: batchId, ano, mes, tipo_calculo: tipoCalculo,
        })));
    }
    await insertEmLotes(admin, 'nfe_resumo_cfop', paraGravar);

    return {
        linhas_processadas: todosRegistros.length,
        linhas_erro: totalLinhas - todosRegistros.length,
        ano,
        mes,
        itens_autorizados: itensAutorizados,
        itens_cancelados: itensCancelados,
    };
}
