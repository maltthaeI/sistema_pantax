import * as XLSX from 'xlsx';
import { parseRelatorioNfeRows } from './parseRelatorioNfe';
import { insertEmLotes } from './shared';

const ABA_RELATORIO = 'Relatório Detalhado por Produto';
const CAMPOS_SOMADOS = ['valor_total', 'valor_ipi', 'valor_icms', 'valor_icms_st', 'valor_icms_uf_destino'];

// A planilha não diz o mês a que se refere — é inferido pela data de emissão
// mais frequente entre as notas do arquivo (a maioria cai no mesmo mês; datas
// avulsas de virada de mês não devem "vencer" a competência do lote).
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
    if (!chaveMaisFrequente) throw new Error('Nenhuma linha com Data de Emissão válida encontrada na planilha.');
    const [ano, mes] = chaveMaisFrequente.split('-').map(Number);
    return { ano, mes };
}

// A tela Resumo só mostra dados agregados por CFOP das notas Autorizadas —
// não há motivo pra gravar uma linha por item da planilha (18k+ linhas por
// upload). Agrega tudo em memória e grava só ~1 linha por CFOP.
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

// Planilha "Relatório Detalhado por Produto": uma única aba com nota + produto juntos por linha.
export async function importarRelatorioNfe(admin, { empresaId, buffer, batchId, tipoCalculo }) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.includes(ABA_RELATORIO)) {
        throw new Error(`Planilha não tem a aba esperada ("${ABA_RELATORIO}"). Abas encontradas: ${workbook.SheetNames.join(', ')}`);
    }

    const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[ABA_RELATORIO], { defval: null });
    const registros = parseRelatorioNfeRows(linhas);
    if (registros.length === 0) throw new Error('Nenhuma linha com Chave de Acesso e CFOP encontrada na planilha.');

    const { ano, mes } = competenciaDoLote(registros);
    const itensAutorizados = registros.filter(r => r.status === 'Autorizada').length;
    const itensCancelados = registros.filter(r => r.status === 'Cancelada').length;
    const agregados = agregarPorCfop(registros);

    // Prévia e Fechamento do mesmo mês convivem — só substitui a versão anterior
    // da mesma competência + tipo (reimportar a mesma Prévia não duplica linhas).
    const { error: erroLimpeza } = await admin.from('nfe_resumo_cfop').delete()
        .eq('empresa_id', empresaId).eq('ano', ano).eq('mes', mes).eq('tipo_calculo', tipoCalculo);
    if (erroLimpeza) throw new Error('Falha ao limpar importação anterior desta competência: ' + erroLimpeza.message);

    const paraGravar = agregados.map(a => ({ ...a, empresa_id: empresaId, import_batch_id: batchId, ano, mes, tipo_calculo: tipoCalculo }));
    await insertEmLotes(admin, 'nfe_resumo_cfop', paraGravar);

    return {
        linhas_processadas: registros.length,
        linhas_erro: linhas.length - registros.length,
        ano,
        mes,
        itens_autorizados: itensAutorizados,
        itens_cancelados: itensCancelados,
    };
}
