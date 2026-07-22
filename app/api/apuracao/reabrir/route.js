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
        return { erro: NextResponse.json({ error: 'Apenas Administradores podem reabrir um período.' }, { status: 403 }) };
    }

    return { usuario: userData.user };
}

export async function POST(request) {
    const admin = getSupabaseAdmin();
    const { erro } = await exigirAdmin(request, admin);
    if (erro) return erro;

    const { periodo_id } = await request.json();
    if (!periodo_id) return NextResponse.json({ error: 'periodo_id é obrigatório.' }, { status: 400 });

    const { data: periodo, error: erroPeriodo } = await admin.from('periodos_apuracao').select('*').eq('id', periodo_id).single();
    if (erroPeriodo || !periodo) return NextResponse.json({ error: 'Período não encontrado.' }, { status: 404 });
    if (periodo.status === 'aberto') return NextResponse.json({ error: 'Este período já está aberto.' }, { status: 409 });

    // Snapshots ficam guardados como histórico do que foi filado; não são apagados na reabertura,
    // apenas sobrescritos se o período for fechado de novo depois de corrigido.
    const { error: erroUpdate } = await admin.from('periodos_apuracao').update({
        status: 'aberto',
        fechado_em: null,
        fechado_por: null,
    }).eq('id', periodo_id);
    if (erroUpdate) return NextResponse.json({ error: erroUpdate.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}
