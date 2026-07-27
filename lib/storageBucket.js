// Nome do bucket do Supabase Storage usado para as planilhas de importação
// (Emitidas/Recebidas/CT-e). Os arquivos sobem direto do navegador pro Storage
// e a rota da API só recebe os caminhos — o corpo da requisição pra Vercel Function
// fica pequeno (JSON), evitando o limite de 4,5MB de payload das serverless functions.
export const STORAGE_BUCKET_IMPORTACOES = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'importacoes-temp';
