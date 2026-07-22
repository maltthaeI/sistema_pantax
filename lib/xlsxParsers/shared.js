// Helpers compartilhados pelos parsers de planilha. As células numéricas das
// planilhas de origem já chegam como números reais (via SheetJS) — não são
// texto mascarado em pt-BR. Nunca usar o parser de string ".replace(/\./g,'')
// .replace(',','.')" aqui: ele é só para inputs mascarados da UI.
export function num(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
}

export function str(v) {
    if (v == null || v === '') return null;
    return String(v);
}

// "01/07/2026" -> "2026-07-01"
export function parseDataBr(v) {
    if (!v) return null;
    const partes = String(v).split('/');
    if (partes.length !== 3) return null;
    const [d, m, y] = partes;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function anoMesDeData(dataISO) {
    if (!dataISO) return null;
    const [ano, mes] = dataISO.split('-');
    return { ano: parseInt(ano, 10), mes: parseInt(mes, 10) };
}

// Encontra (ou cria) o período de apuração de uma empresa para um ano/mês,
// com cache em memória para não repetir a mesma consulta centenas de vezes
// dentro de uma única importação.
export async function resolverPeriodoId(admin, empresaId, dataISO, cache) {
    const am = anoMesDeData(dataISO);
    if (!am) return null;
    const chave = `${empresaId}:${am.ano}-${am.mes}`;
    if (cache.has(chave)) return cache.get(chave);

    const { data: existente } = await admin
        .from('periodos_apuracao')
        .select('id, status')
        .eq('empresa_id', empresaId)
        .eq('ano', am.ano)
        .eq('mes', am.mes)
        .maybeSingle();

    if (existente) {
        cache.set(chave, existente);
        return existente;
    }

    const { data: criado, error } = await admin
        .from('periodos_apuracao')
        .insert([{ empresa_id: empresaId, ano: am.ano, mes: am.mes }])
        .select('id, status')
        .single();

    if (error) {
        // corrida entre linhas concorrentes tentando criar o mesmo período — tenta buscar de novo
        const { data: retry } = await admin
            .from('periodos_apuracao')
            .select('id, status')
            .eq('empresa_id', empresaId).eq('ano', am.ano).eq('mes', am.mes)
            .maybeSingle();
        if (retry) { cache.set(chave, retry); return retry; }
        throw error;
    }

    cache.set(chave, criado);
    return criado;
}

export async function upsertEmLotes(admin, tabela, linhas, conflictColumns, tamanhoLote = 500) {
    let processadas = 0;
    for (let i = 0; i < linhas.length; i += tamanhoLote) {
        const lote = linhas.slice(i, i + tamanhoLote);
        const { error } = await admin.from(tabela).upsert(lote, { onConflict: conflictColumns });
        if (error) throw new Error(`Falha ao gravar em ${tabela} (linhas ${i + 1}-${i + lote.length}): ${error.message}`);
        processadas += lote.length;
    }
    return processadas;
}

export async function insertEmLotes(admin, tabela, linhas, tamanhoLote = 500) {
    let processadas = 0;
    for (let i = 0; i < linhas.length; i += tamanhoLote) {
        const lote = linhas.slice(i, i + tamanhoLote);
        const { error } = await admin.from(tabela).insert(lote);
        if (error) throw new Error(`Falha ao gravar em ${tabela} (linhas ${i + 1}-${i + lote.length}): ${error.message}`);
        processadas += lote.length;
    }
    return processadas;
}
