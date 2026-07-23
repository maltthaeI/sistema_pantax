import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { exigirUsuarioLogado } from '@/lib/apiAuth';
import { importarRelatorioNfe } from '@/lib/xlsxParsers/importarRelatorioNfe';
import { extrairNomeEmpresaDoArquivo } from '@/lib/nomeEmpresaDoArquivo';

export const maxDuration = 60;

const TIPOS_ARQUIVO = ['emitidas', 'recebidas', 'cte'];

async function encontrarOuCriarEmpresa(admin, nomeEmpresa) {
    const { data: existente } = await admin.from('empresas').select('id').ilike('razao_social', nomeEmpresa).maybeSingle();
    if (existente) return existente.id;

    const { data: criada, error } = await admin.from('empresas').insert([{ razao_social: nomeEmpresa }]).select('id').single();
    if (error) throw new Error('Falha ao criar empresa: ' + error.message);
    return criada.id;
}

export async function POST(request) {
    const admin = getSupabaseAdmin();
    const { usuario, erro } = await exigirUsuarioLogado(request, admin);
    if (erro) return erro;

    const formData = await request.formData();
    const tipoCalculo = formData.get('tipo_calculo');
    if (!['previa', 'fechamento'].includes(tipoCalculo)) {
        return NextResponse.json({ error: 'Informe se é Prévia ou Fechamento.' }, { status: 400 });
    }

    const arquivosPorTipo = {};
    for (const tipo of TIPOS_ARQUIVO) {
        const file = formData.get(tipo);
        if (!file) return NextResponse.json({ error: `Arquivo de ${tipo} é obrigatório.` }, { status: 400 });
        arquivosPorTipo[tipo] = file;
    }

    // Nome da empresa vem sempre do arquivo de Emitidas.
    let nomeEmpresa, empresaId;
    try {
        nomeEmpresa = extrairNomeEmpresaDoArquivo(arquivosPorTipo.emitidas.name);
        empresaId = await encontrarOuCriarEmpresa(admin, nomeEmpresa);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const { data: batch } = await admin.from('import_batches').insert([{
        empresa_id: empresaId, tipo_arquivo: 'nfe', tipo_calculo: tipoCalculo,
        nome_arquivo_emitidas: arquivosPorTipo.emitidas.name,
        nome_arquivo_recebidas: arquivosPorTipo.recebidas.name,
        nome_arquivo_cte: arquivosPorTipo.cte.name,
        status: 'processando', importado_por: usuario.id,
    }]).select().single();

    try {
        const arquivos = await Promise.all(TIPOS_ARQUIVO.map(async (tipo) => ({
            tipo, buffer: await arquivosPorTipo[tipo].arrayBuffer(),
        })));
        const resultado = await importarRelatorioNfe(admin, { empresaId, arquivos, batchId: batch.id, tipoCalculo });

        await admin.from('import_batches').update({
            status: 'concluido', linhas_processadas: resultado.linhas_processadas, linhas_erro: resultado.linhas_erro,
            ano: resultado.ano, mes: resultado.mes,
            itens_autorizados: resultado.itens_autorizados, itens_cancelados: resultado.itens_cancelados,
        }).eq('id', batch.id);

        return NextResponse.json({ ...resultado, empresa_id: empresaId, empresa_nome: nomeEmpresa, tipo_calculo: tipoCalculo });
    } catch (e) {
        await admin.from('import_batches').update({ status: 'erro', erro_detalhe: e.message }).eq('id', batch.id);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
