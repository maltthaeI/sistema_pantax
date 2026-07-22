import * as XLSX from 'xlsx';
import { parseNotasFiscaisHeaderRows, parseNotaFiscalItemRows } from './parseNotasFiscais';
import { resolverPeriodoId, upsertEmLotes, insertEmLotes } from './shared';

const ABA_NOTAS = 'Relatório Detalhado por Nota';
const ABA_ITENS = 'Relatório Detalhado por Produto';

// Compartilhado entre /api/import/emitidas e /api/import/recebidas — as duas
// planilhas têm exatamente a mesma estrutura de abas, só muda a direção.
export async function importarNotasFiscais(admin, { empresaId, direcao, buffer, batchId }) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames.includes(ABA_NOTAS) || !workbook.SheetNames.includes(ABA_ITENS)) {
        throw new Error(`Planilha não tem as abas esperadas ("${ABA_NOTAS}" e "${ABA_ITENS}"). Abas encontradas: ${workbook.SheetNames.join(', ')}`);
    }

    const linhasNotas = XLSX.utils.sheet_to_json(workbook.Sheets[ABA_NOTAS], { defval: null });
    const linhasItens = XLSX.utils.sheet_to_json(workbook.Sheets[ABA_ITENS], { defval: null });

    const notas = parseNotasFiscaisHeaderRows(linhasNotas, direcao);
    const itens = parseNotaFiscalItemRows(linhasItens);
    if (notas.length === 0) throw new Error('Nenhuma linha com Chave de Acesso encontrada na aba de notas.');

    // Resolve o período de cada nota e bloqueia o import inteiro se alguma
    // linha cair num período já fechado (nunca grava parcialmente).
    const cachePeriodos = new Map();
    const notasComPeriodo = [];
    for (const n of notas) {
        const periodo = await resolverPeriodoId(admin, empresaId, n.data_emissao, cachePeriodos);
        if (!periodo) continue;
        notasComPeriodo.push({ ...n, periodo_id: periodo.id, empresa_id: empresaId, import_batch_id: batchId, _status: periodo.status });
    }

    const periodoFechado = notasComPeriodo.find(n => n._status === 'fechado');
    if (periodoFechado) {
        throw new Error(`Este arquivo contém notas em ${periodoFechado.data_emissao} cujo período já está fechado. Reabra o período antes de reimportar.`);
    }

    const notasParaGravar = notasComPeriodo.map(({ _status, ...resto }) => resto);
    await upsertEmLotes(admin, 'notas_fiscais', notasParaGravar, 'empresa_id,chave_acesso');

    // Busca os ids reais (upsert não garante retorno consistente em lotes) para linkar os itens.
    const chaves = notasParaGravar.map(n => n.chave_acesso);
    const mapaChaveParaId = new Map();
    for (let i = 0; i < chaves.length; i += 500) {
        const lote = chaves.slice(i, i + 500);
        const { data, error } = await admin.from('notas_fiscais').select('id, chave_acesso').eq('empresa_id', empresaId).in('chave_acesso', lote);
        if (error) throw new Error('Falha ao localizar notas gravadas: ' + error.message);
        data.forEach(n => mapaChaveParaId.set(n.chave_acesso, n.id));
    }

    const idsNotas = [...mapaChaveParaId.values()];
    // Re-upload idempotente: sem chave natural estável para itens entre exports,
    // então apaga os itens existentes das notas deste arquivo e insere os novos.
    for (let i = 0; i < idsNotas.length; i += 500) {
        const lote = idsNotas.slice(i, i + 500);
        const { error } = await admin.from('nota_fiscal_itens').delete().in('nota_fiscal_id', lote);
        if (error) throw new Error('Falha ao limpar itens antigos: ' + error.message);
    }

    const itensParaGravar = itens
        .filter(it => mapaChaveParaId.has(it.chave_acesso))
        .map(({ chave_acesso, ...resto }) => ({ ...resto, nota_fiscal_id: mapaChaveParaId.get(chave_acesso) }));

    const itensProcessados = await insertEmLotes(admin, 'nota_fiscal_itens', itensParaGravar);

    return {
        linhas_processadas: notasParaGravar.length,
        linhas_erro: notas.length - notasParaGravar.length,
        itens_processados: itensProcessados,
        itens_orfaos: itens.length - itensParaGravar.length,
    };
}
