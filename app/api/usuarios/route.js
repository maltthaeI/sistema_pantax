import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const NIVEIS_VALIDOS = ['Operador', 'Administrador'];

// Confirma quem está chamando a API (pelo token da sessão atual) e exige que seja Administrador.
// Isso é o que impede qualquer pessoa de usar esta rota para criar contas com nível de acesso total.
async function exigirAdmin(request) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return { erro: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) };

    const admin = getSupabaseAdmin();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
        return { erro: NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 }) };
    }

    const { data: perfil } = await admin.from('profiles').select('nivel').eq('id', userData.user.id).single();
    if (!perfil || perfil.nivel !== 'Administrador') {
        return { erro: NextResponse.json({ error: 'Apenas Administradores podem gerenciar usuários.' }, { status: 403 }) };
    }

    return { admin, chamador: userData.user };
}

export async function POST(request) {
    const body = await request.json();
    const { admin, erro } = await exigirAdmin(request);
    if (erro) return erro;

    const { email, senha, nome, nivel } = body;
    if (!email || !senha || !nome || !nivel) {
        return NextResponse.json({ error: 'Preencha e-mail, senha, nome e nível.' }, { status: 400 });
    }
    if (!NIVEIS_VALIDOS.includes(nivel)) {
        return NextResponse.json({ error: 'Nível de acesso inválido.' }, { status: 400 });
    }
    if (String(senha).length < 8) {
        return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    const { data: novoUsuario, error: erroCriacao } = await admin.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password: senha,
        email_confirm: true,
    });
    if (erroCriacao) {
        return NextResponse.json({ error: erroCriacao.message }, { status: 400 });
    }

    const { data: perfil, error: erroPerfil } = await admin
        .from('profiles')
        .insert([{ id: novoUsuario.user.id, nome, nivel }])
        .select()
        .single();

    if (erroPerfil) {
        // Se o perfil falhar, não deixa um usuário de Auth órfão sem perfil.
        await admin.auth.admin.deleteUser(novoUsuario.user.id);
        return NextResponse.json({ error: erroPerfil.message }, { status: 400 });
    }

    return NextResponse.json({ perfil });
}

export async function PUT(request) {
    const body = await request.json();
    const { admin, erro } = await exigirAdmin(request);
    if (erro) return erro;

    const { id, nome, nivel, novaSenha } = body;
    if (!id || !nome || !nivel) {
        return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }
    if (!NIVEIS_VALIDOS.includes(nivel)) {
        return NextResponse.json({ error: 'Nível de acesso inválido.' }, { status: 400 });
    }
    if (novaSenha && String(novaSenha).length < 8) {
        return NextResponse.json({ error: 'A nova senha precisa ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    if (novaSenha) {
        const { error: erroSenha } = await admin.auth.admin.updateUserById(id, { password: novaSenha });
        if (erroSenha) return NextResponse.json({ error: erroSenha.message }, { status: 400 });
    }

    const { data: perfil, error: erroPerfil } = await admin
        .from('profiles')
        .update({ nome, nivel })
        .eq('id', id)
        .select()
        .single();

    if (erroPerfil) return NextResponse.json({ error: erroPerfil.message }, { status: 400 });

    return NextResponse.json({ perfil });
}
