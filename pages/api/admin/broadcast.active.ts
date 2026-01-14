
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { isAdminUser } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, target, starts_at, ends_at } = req.body;

  if (!title || !body || !target) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  try {
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // Check Admin Permissions
    const isAdmin = await isAdminUser(supabase, user.id, user.email);

    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase.from('broadcastmessages').insert({
      title,
      body,
      target,
      starts_at: starts_at || new Date().toISOString(),
      ends_at: ends_at || null, // null significa "sem data de término" (ou nunca expira, dependendo da regra, mas aqui vamos usar null como infinito)
      createdat: new Date().toISOString()
    });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
