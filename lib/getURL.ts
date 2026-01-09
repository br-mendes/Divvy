
/**
 * Helper para garantir que as URLs de redirecionamento apontem para o domínio correto.
 */
export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL || 
    process.env.NEXT_PUBLIC_VERCEL_URL || 
    'http://localhost:3000';
  
  // No cliente, a verdade absoluta é a barra de endereços
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }

  // Remove barra no final para evitar o erro de "//auth/callback"
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Garante que tenha o protocolo correto
  url = url.startsWith('http') ? url : `https://${url}`;
  
  return url;
};
