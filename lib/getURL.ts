/**
 * Função para obter a URL dinâmica baseada no ambiente
 * Garante que o Supabase use a URL correta em dev e produção
 */
export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // URL de produção definida manualmente
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Auto-gerado pela Vercel
    'http://localhost:3000/'; // Fallback para desenvolvimento

  // Garante que tenha https:// quando não for localhost e não tiver protocolo
  url = url.startsWith('http') ? url : `https://${url}`;

  // Garante que tenha trailing slash
  url = url.endsWith('/') ? url : `${url}/`;

  return url;
};