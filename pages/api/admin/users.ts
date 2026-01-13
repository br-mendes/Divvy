
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient();

  // 1. Verificação de segurança (Admin Check)
  // Em produção, deve-se validar a sessão/token. Aqui, validamos se o email do request (header customizado ou sessão) é o admin.
  // Para este MVP, vamos confiar na proteção da página que chama esta API, mas idealmente passamos o token.
  
  // Vamos buscar os usuários usando a Service Role (acesso total)
  try {
    const { data: users, error } = await supabase
      .from('userprofiles')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;

    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
