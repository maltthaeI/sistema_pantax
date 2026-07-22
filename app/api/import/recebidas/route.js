import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { exigirUsuarioLogado } from '@/lib/apiAuth';
import { importarNotasFiscais } from '@/lib/xlsxParsers/importarNotasFiscais';

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
        empresa_id: empresaId, tipo_arquivo: 'recebidas', nome_arquivo: file.name, status: 'processando', importado_por: usuario.id,
    }]).select().single();

    try {
        const buffer = await file.arrayBuffer();
        const resultado = await importarNotasFiscais(admin, { empresaId, direcao: 'recebida', buffer, batchId: batch.id });

        await admin.from('import_batches').update({
            status: 'concluido', linhas_processadas: resultado.linhas_processadas, linhas_erro: resultado.linhas_erro,
        }).eq('id', batch.id);

        return NextResponse.json(resultado);
    } catch (e) {
        await admin.from('import_batches').update({ status: 'erro', erro_detalhe: e.message }).eq('id', batch.id);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
