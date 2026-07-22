import { createClient } from '@supabase/supabase-js';

// Cliente com a service_role key: ignora RLS por completo.
// Só pode ser importado por código que roda no servidor (ex: app/api/**/route.js).
// Nunca importar isto a partir de um componente "use client".
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY (e NEXT_PUBLIC_SUPABASE_URL) nas variáveis de ambiente do servidor.');
    }
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
