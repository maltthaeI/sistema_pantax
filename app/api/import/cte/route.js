import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { exigirUsuarioLogado } from '@/lib/apiAuth';
import { parseCteRows } from '@/lib/xlsxParsers/parseCte';
import { resolverPeriodoId, upsertEmLotes } from '@/lib/xlsxParsers/shared';

export const maxDuration = 60;

export async function POST(request) {
    const admin = getSupabaseAdmin();
    const { usuario, erro } = await exigirUsuarioLogado(request, admin);
    if (erro) return erro;

    const formData = await request.formData();
    const file = formData.get('file');
    const empresaId = formData.get('empresa_id');
    if (!file || !empresaId) return NextResponse.json({ error: 'Arquivo e empresa são obrigatórios.' }, { status: 400 });

    const { data: batch } = await admin.from('import_batches').insert([{
        empresa_id: empresaId, tipo_arquivo: 'cte', nome_arquivo: file.name, status: 'processando', importado_por: usuario.id,
    }]).select().single();

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        // A planilha de origem tem uma aba de pivot ("Planilha1") e uma aba de dados —
        // pega a aba com mais colunas, que é sempre o relatório detalhado.
        const nomeAba = workbook.SheetNames.reduce((maior, atual) => {
            const colsAtual = XLSX.utils.decode_range(workbook.Sheets[atual]['!ref'] || 'A1:A1').e.c;
            const colsMaior = XLSX.utils.decode_range(workbook.Sheets[maior]['!ref'] || 'A1:A1').e.c;
            return colsAtual > colsMaior ? atual : maior;
        }, workbook.SheetNames[0]);
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[nomeAba], { defval: null });

        const registros = parseCteRows(rows);
        if (registros.length === 0) throw new Error('Nenhuma linha com Chave de Acesso encontrada na planilha.');

        const cachePeriodos = new Map();
        const comPeriodo = [];
        for (const r of registros) {
            const periodo = await resolverPeriodoId(admin, empresaId, r.data_emissao, cachePeriodos);
            if (!periodo) continue; // linha sem data de emissão válida — pulada
            comPeriodo.push({ ...r, periodo_id: periodo.id, empresa_id: empresaId, import_batch_id: batch.id, _status: periodo.status });
        }

        const periodoFechado = comPeriodo.find(r => r._status === 'fechado');
        if (periodoFechado) {
            throw new Error(`Este arquivo contém lançamentos em ${periodoFechado.data_emissao} cujo período já está fechado. Reabra o período antes de reimportar.`);
        }

        const paraGravar = comPeriodo.map(({ _status, ...resto }) => resto);
        const processadas = await upsertEmLotes(admin, 'cte_documentos', paraGravar, 'empresa_id,chave_acesso');

        await admin.from('import_batches').update({
            status: 'concluido', linhas_processadas: processadas, linhas_erro: registros.length - comPeriodo.length,
        }).eq('id', batch.id);

        return NextResponse.json({ linhas_processadas: processadas, linhas_erro: registros.length - comPeriodo.length });
    } catch (e) {
        await admin.from('import_batches').update({ status: 'erro', erro_detalhe: e.message }).eq('id', batch.id);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
