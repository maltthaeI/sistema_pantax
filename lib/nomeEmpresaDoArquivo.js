// Dois padrões de nome de arquivo conhecidos:
//   1) "<Empresa> - <Tipo>.xlsx"              (ex: "Grand Variety - Emitidas.xlsx")
//   2) "report_nfe_<empresa_snake_case>_<hash>.xlsx"  (ex: "report_nfe_armarinhos_belo_ltda_6a61195c5b602.xlsx")
const PREFIXO_REPORT_NFE = 'report_nfe_';

export function extrairNomeEmpresaDoArquivo(nomeArquivo) {
    const semExtensao = String(nomeArquivo || '').replace(/\.xlsx$/i, '').trim();

    if (semExtensao.toLowerCase().startsWith(PREFIXO_REPORT_NFE)) {
        const partes = semExtensao.slice(PREFIXO_REPORT_NFE.length).split('_').filter(Boolean);
        // último pedaço costuma ser um hash hexadecimal — não faz parte do nome da empresa.
        if (partes.length > 1 && /^[0-9a-f]+$/i.test(partes[partes.length - 1])) {
            partes.pop();
        }
        if (partes.length === 0) {
            throw new Error(`Não foi possível extrair o nome da empresa do arquivo "${nomeArquivo}".`);
        }
        return partes.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }

    const separador = semExtensao.indexOf(' - ');
    if (separador > 0) {
        return semExtensao.slice(0, separador).trim();
    }

    throw new Error(`Não foi possível identificar a empresa pelo nome do arquivo ("${nomeArquivo}"). Use o padrão "<Empresa> - Emitidas.xlsx" ou "report_nfe_<empresa>_<hash>.xlsx".`);
}
