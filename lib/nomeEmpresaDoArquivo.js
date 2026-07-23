// Nome do arquivo sempre no padrão "report_nfe_<empresa_em_snake_case>_<hash>.xlsx"
// (ex: "report_nfe_armarinhos_belo_ltda_6a61195c5b602.xlsx" -> "Armarinhos Belo Ltda").
const PREFIXO = 'report_nfe_';

export function extrairNomeEmpresaDoArquivo(nomeArquivo) {
    const semExtensao = String(nomeArquivo || '').replace(/\.xlsx$/i, '');
    if (!semExtensao.toLowerCase().startsWith(PREFIXO)) {
        throw new Error(`Nome de arquivo inesperado ("${nomeArquivo}"). Esperado o padrão "${PREFIXO}<empresa>_<hash>.xlsx".`);
    }

    const partes = semExtensao.slice(PREFIXO.length).split('_').filter(Boolean);
    // último pedaço costuma ser um hash hexadecimal — não faz parte do nome da empresa.
    if (partes.length > 1 && /^[0-9a-f]+$/i.test(partes[partes.length - 1])) {
        partes.pop();
    }

    if (partes.length === 0) {
        throw new Error(`Não foi possível extrair o nome da empresa do arquivo "${nomeArquivo}".`);
    }

    return partes.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
