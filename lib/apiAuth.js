import { NextResponse } from 'next/server';

// Import é rotina operacional — qualquer usuário logado (Operador ou Administrador)
// pode subir planilhas. Só fechar/reabrir período e gerenciar empresas/usuários
// exige Administrador (checado nas próprias rotas que precisam disso).
export async function exigirUsuarioLogado(request, admin) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return { erro: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) };

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
        return { erro: NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 }) };
    }

    const { data: perfil } = await admin.from('profiles').select('*').eq('id', userData.user.id).single();
    if (!perfil) return { erro: NextResponse.json({ error: 'Usuário sem perfil cadastrado.' }, { status: 403 }) };

    return { usuario: userData.user, perfil };
}
