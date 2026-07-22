import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function exigirAdmin(request, admin) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return { erro: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) };

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
        return { erro: NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 }) };
    }

    const { data: perfil } = await admin.from('profiles').select('nivel').eq('id', userData.user.id).single();
    if (!perfil || perfil.nivel !== 'Administrador') {
        return { erro: NextResponse.json({ error: 'Apenas Administradores podem fechar um período.' }, { status: 403 }) };
    }

    return { usuario: userData.user };
}

export async function POST(request) {
    const admin = getSupabaseAdmin();
    const { usuario, erro } = await exigirAdmin(request, admin);
    if (erro) return erro;

    const { periodo_id } = await request.json();
    if (!periodo_id) return NextResponse.json({ error: 'periodo_id é obrigatório.' }, { status: 400 });

    const { data: periodo, error: erroPeriodo } = await admin.from('periodos_apuracao').select('*').eq('id', periodo_id).single();
    if (erroPeriodo || !periodo) return NextResponse.json({ error: 'Período não encontrado.' }, { status: 404 });
    if (periodo.status === 'fechado') return NextResponse.json({ error: 'Este período já está fechado.' }, { status: 409 });

    const { data: icmsRows, error: erroIcms } = await admin.rpc('calcular_apuracao_icms', { p_periodo_id: periodo_id });
    if (erroIcms || !icmsRows?.[0]) return NextResponse.json({ error: 'Falha ao calcular apuração de ICMS: ' + (erroIcms?.message || '') }, { status: 500 });
    const icms = icmsRows[0];

    const { data: pisCofinsRows, error: erroPisCofins } = await admin.rpc('calcular_apuracao_pis_cofins', { p_periodo_id: periodo_id });
    if (erroPisCofins || !pisCofinsRows?.[0]) return NextResponse.json({ error: 'Falha ao calcular apuração de PIS/COFINS: ' + (erroPisCofins?.message || '') }, { status: 500 });
    const pisCofins = pisCofinsRows[0];

    const { error: erroSnapIcms } = await admin.from('apuracao_icms_snapshot').upsert([{
        periodo_id,
        debito_saidas: icms.debito_saidas,
        debito_estorno: icms.debito_estorno,
        credito_devolucoes: icms.credito_devolucoes,
        credito_nfe_entradas: icms.credito_nfe_entradas,
        credito_cte: icms.credito_cte,
        credito_acumulado_anterior: icms.credito_acumulado_anterior,
        resultado: icms.resultado,
        saldo_credor_final: icms.saldo_credor_final,
        gerado_por: usuario.id,
    }], { onConflict: 'periodo_id' });
    if (erroSnapIcms) return NextResponse.json({ error: 'Falha ao gravar snapshot de ICMS: ' + erroSnapIcms.message }, { status: 500 });

    const { error: erroSnapPisCofins } = await admin.from('apuracao_pis_cofins_snapshot').upsert([{
        periodo_id,
        aliquota_pis_debito: pisCofins.aliquota_pis_debito,
        aliquota_pis_credito: pisCofins.aliquota_pis_credito,
        aliquota_cofins_debito: pisCofins.aliquota_cofins_debito,
        aliquota_cofins_credito: pisCofins.aliquota_cofins_credito,
        base_debito: pisCofins.base_debito,
        base_credito: pisCofins.base_credito,
        debito_pis: pisCofins.debito_pis,
        credito_pis: pisCofins.credito_pis,
        resultado_pis: pisCofins.resultado_pis,
        debito_cofins: pisCofins.debito_cofins,
        credito_cofins: pisCofins.credito_cofins,
        resultado_cofins: pisCofins.resultado_cofins,
        gerado_por: usuario.id,
    }], { onConflict: 'periodo_id' });
    if (erroSnapPisCofins) return NextResponse.json({ error: 'Falha ao gravar snapshot de PIS/COFINS: ' + erroSnapPisCofins.message }, { status: 500 });

    const { error: erroUpdate } = await admin.from('periodos_apuracao').update({
        status: 'fechado',
        fechado_em: new Date().toISOString(),
        fechado_por: usuario.id,
    }).eq('id', periodo_id);
    if (erroUpdate) return NextResponse.json({ error: 'Falha ao marcar período como fechado: ' + erroUpdate.message }, { status: 500 });

    // Semeia o saldo credor de abertura do próximo período (mês seguinte), se ele já existir.
    if (icms.saldo_credor_final > 0) {
        const proximoMes = periodo.mes === 12 ? 1 : periodo.mes + 1;
        const proximoAno = periodo.mes === 12 ? periodo.ano + 1 : periodo.ano;
        await admin.from('periodos_apuracao')
            .update({ credito_icms_acumulado_anterior: icms.saldo_credor_final })
            .eq('empresa_id', periodo.empresa_id).eq('ano', proximoAno).eq('mes', proximoMes).eq('status', 'aberto');
    }

    return NextResponse.json({ ok: true, icms, pisCofins });
}
