import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { exigirUsuarioLogado } from '@/lib/apiAuth';
import { importarRelatorioNfe } from '@/lib/xlsxParsers/importarRelatorioNfe';
import { extrairNomeEmpresaDoArquivo } from '@/lib/nomeEmpresaDoArquivo';
import { STORAGE_BUCKET_IMPORTACOES } from '@/lib/storageBucket';

export const maxDuration = 60;

const TIPOS_ARQUIVO = ['emitidas', 'recebidas', 'cte'];

async function encontrarOuCriarEmpresa(admin, nomeEmpresa) {
    const { data: existente } = await admin.from('empresas').select('id').ilike('razao_social', nomeEmpresa).maybeSingle();
    if (existente) return existente.id;

    const { data: criada, error } = await admin.from('empresas').insert([{ razao_social: nomeEmpresa }]).select('id').single();
    if (error) throw new Error('Falha ao criar empresa: ' + error.message);
    return criada.id;
}

async function baixarDoStorage(admin, path) {
    const { data, error } = await admin.storage.from(STORAGE_BUCKET_IMPORTACOES).download(path);
    if (error) throw new Error(`Falha ao baixar "${path}" do Storage: ${error.message}`);
    return Buffer.from(await data.arrayBuffer());
}

// Os arquivos já chegaram no Supabase Storage (upload feito direto do navegador —
// ver AppContext.uploadRelatorioNfe). Aqui só recebemos os caminhos (JSON pequeno,
// não esbarra no limite de 4,5MB de corpo de requisição das Vercel Functions) e
// baixamos do Storage pra processar.
export async function POST(request) {
    const admin = getSupabaseAdmin();
    const { usuario, perfil, erro } = await exigirUsuarioLogado(request, admin);
    if (erro) return erro;
    // Esta rota usa o client de service role (ignora RLS), então o bloqueio de
    // escrita do usuário demo precisa ser explícito aqui — RLS sozinha não cobre.
    if (perfil?.nivel === 'Demo') {
        return NextResponse.json({ error: 'Modo demonstração: importação desabilitada.' }, { status: 403 });
    }

    const corpo = await request.json();
    const tipoCalculo = corpo.tipo_calculo;
    if (!['previa', 'fechamento'].includes(tipoCalculo)) {
        return NextResponse.json({ error: 'Informe se é Prévia ou Fechamento.' }, { status: 400 });
    }

    const arquivosPorTipo = {};
    for (const tipo of TIPOS_ARQUIVO) {
        const arquivo = corpo.arquivos?.[tipo];
        if (!arquivo?.path) return NextResponse.json({ error: `Arquivo de ${tipo} é obrigatório.` }, { status: 400 });
        arquivosPorTipo[tipo] = arquivo;
    }
    const caminhosStorage = TIPOS_ARQUIVO.map(tipo => arquivosPorTipo[tipo].path);

    // Nome da empresa vem sempre do arquivo de Emitidas.
    let nomeEmpresa, empresaId;
    try {
        nomeEmpresa = extrairNomeEmpresaDoArquivo(arquivosPorTipo.emitidas.nome);
        empresaId = await encontrarOuCriarEmpresa(admin, nomeEmpresa);
    } catch (e) {
        await admin.storage.from(STORAGE_BUCKET_IMPORTACOES).remove(caminhosStorage).catch(() => {});
        return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const { data: batch } = await admin.from('import_batches').insert([{
        empresa_id: empresaId, tipo_arquivo: 'nfe', tipo_calculo: tipoCalculo,
        nome_arquivo_emitidas: arquivosPorTipo.emitidas.nome,
        nome_arquivo_recebidas: arquivosPorTipo.recebidas.nome,
        nome_arquivo_cte: arquivosPorTipo.cte.nome,
        status: 'processando', importado_por: usuario.id,
    }]).select().single();

    try {
        const arquivos = await Promise.all(TIPOS_ARQUIVO.map(async (tipo) => ({
            tipo, buffer: await baixarDoStorage(admin, arquivosPorTipo[tipo].path),
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
    } finally {
        // Já processado (ou falhou) — não precisa manter os arquivos no bucket.
        await admin.storage.from(STORAGE_BUCKET_IMPORTACOES).remove(caminhosStorage).catch(() => {});
    }
}
