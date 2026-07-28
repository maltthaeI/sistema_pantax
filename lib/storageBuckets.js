// Bucket privado usado como área de passagem para os arquivos de importação:
// o navegador sobe direto pro Storage (contorna o limite de corpo de requisição
// da Vercel) e a rota server-side baixa de lá com a service role.
export const BUCKET_IMPORTACOES = 'importacoes-temp';
