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

// CFOP começando em 1/2/3 = entrada; 5/6/7 = saída (padrão da tabela CFOP).
export function direcaoDoCfop(cfop) {
    const primeiroDigito = String(cfop || '').trim()[0];
    if (['1', '2', '3'].includes(primeiroDigito)) return 'entrada';
    if (['5', '6', '7'].includes(primeiroDigito)) return 'saida';
    return null;
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
