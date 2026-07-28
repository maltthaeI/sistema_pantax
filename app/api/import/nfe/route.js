import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { exigirUsuarioLogado } from '@/lib/apiAuth';
import { importarRelatorioNfe } from '@/lib/xlsxParsers/importarRelatorioNfe';
import { extrairNomeEmpresaDoArquivo } from '@/lib/nomeEmpresaDoArquivo';
import { BUCKET_IMPORTACOES } from '@/lib/storageBuckets';

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

    const body = await request.json();
    const tipoCalculo = body.tipo_calculo;
    if (!['previa', 'fechamento'].includes(tipoCalculo)) {
        return NextResponse.json({ error: 'Informe se é Prévia ou Fechamento.' }, { status: 400 });
    }

    // Os arquivos já foram subidos direto do navegador pro Storage (ver AppContext.uploadRelatorioNfe) —
    // aqui só chegam os caminhos, pra não estourar o limite de corpo de requisição da Vercel.
    const arquivosInfo = body.arquivos || {};
    const arquivosPorTipo = {};
    const caminhosParaLimpar = [];
    for (const tipo of TIPOS_ARQUIVO) {
        const info = arquivosInfo[tipo];
        if (!info?.caminho || !info?.nome) return NextResponse.json({ error: `Arquivo de ${tipo} é obrigatório.` }, { status: 400 });
        arquivosPorTipo[tipo] = info;
        caminhosParaLimpar.push(info.caminho);
    }

    const limparArquivosTemporarios = () => admin.storage.from(BUCKET_IMPORTACOES).remove(caminhosParaLimpar);

    let buffersPorTipo;
    try {
        buffersPorTipo = {};
        for (const tipo of TIPOS_ARQUIVO) {
            const { data, error: erroDownload } = await admin.storage.from(BUCKET_IMPORTACOES).download(arquivosPorTipo[tipo].caminho);
            if (erroDownload) throw new Error(`Falha ao ler arquivo de ${tipo}: ${erroDownload.message}`);
            buffersPorTipo[tipo] = await data.arrayBuffer();
        }
    } catch (e) {
        await limparArquivosTemporarios();
        return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Nome da empresa vem sempre do arquivo de Emitidas.
    let nomeEmpresa, empresaId;
    try {
        nomeEmpresa = extrairNomeEmpresaDoArquivo(arquivosPorTipo.emitidas.nome);
        empresaId = await encontrarOuCriarEmpresa(admin, nomeEmpresa);
    } catch (e) {
        await limparArquivosTemporarios();
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
        const arquivos = TIPOS_ARQUIVO.map(tipo => ({ tipo, buffer: buffersPorTipo[tipo] }));
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
        await limparArquivosTemporarios();
    }
}
