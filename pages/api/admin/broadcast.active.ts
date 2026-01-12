
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, target, secret } = req.body;

  // Verificação de segurança simples (em produção usaríamos sessões/JWT robustos)
  // O frontend admin deve enviar uma chave ou verificamos a sessão no servidor.
  // Aqui, assumimos que a proteção middleware é suficiente e/ou validamos um secret se necessário.
  
  if (!title || !body || !target) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  const supabase = createServerSupabaseClient();

  try {
    const { error } = await supabase.from('broadcastmessages').insert({
      title,
      body,
      target,
      createdat: new Date().toISOString()
    });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
