import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local ou nas variáveis de ambiente do deploy).');
}

const supabaseReal = createClient(supabaseUrl, supabaseAnonKey);

// Modo demonstração: quando ativo, bloqueia toda escrita antes mesmo de sair
// para a rede, mostrando uma mensagem amigável no formato { data, error } que
// o resto do app já espera. A RLS (ver supabase/demo_role_migration.sql) é o
// bloqueio real; isto aqui é só para uma UX melhor do que um erro cru do
// Supabase quando o usuário demo tenta salvar algo.
let somenteLeitura = false;
export function setSomenteLeitura(valor) {
    somenteLeitura = valor;
}

const ERRO_DEMO = { message: 'Modo demonstração: somente visualização, edição desabilitada.' };
const METODOS_ESCRITA = ['insert', 'update', 'upsert', 'delete'];

// Objeto sintético que imita uma query do Supabase em modo bloqueado: qualquer
// método encadeado (.eq, .select, .match...) devolve ele mesmo, e ele resolve
// como uma Promise para { data: null, error }. Não toca no objeto real do
// supabase-js (que usa campos privados internos e não pode ser envolvido por
// um Proxy transparente sem quebrar).
function criarQueryBloqueada() {
    const promise = Promise.resolve({ data: null, error: ERRO_DEMO });
    const stub = new Proxy(function () {}, {
        get(_target, prop) {
            if (prop === 'then') return promise.then.bind(promise);
            if (prop === 'catch') return promise.catch.bind(promise);
            if (prop === 'finally') return promise.finally.bind(promise);
            return () => stub;
        },
        apply() {
            return stub;
        },
    });
    return stub;
}

export const supabase = new Proxy(supabaseReal, {
    // receiver fixo em "target" (não no proxy) para não quebrar getters/campos
    // privados internos do supabase-js que dependem de "this" ser a instância real.
    get(target, prop) {
        if (prop !== 'from') return Reflect.get(target, prop, target);

        return (table) => {
            const queryBuilder = target.from(table);
            if (!somenteLeitura) return queryBuilder;

            // .from() do supabase-js sempre devolve uma instância nova, então é
            // seguro sobrescrever só estas 4 propriedades nela — sem Proxy, sem
            // mexer no "this" que os outros métodos (select, eq, order...) usam.
            for (const metodo of METODOS_ESCRITA) {
                queryBuilder[metodo] = () => criarQueryBloqueada();
            }
            return queryBuilder;
        };
    },
});
