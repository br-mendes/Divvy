
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient, User } from '@supabase/supabase-js';

// Fallback values must match those in lib/supabase.ts
const DEFAULT_URL = 'https://jpgifiumxqzbroejhudc.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

/**
 * Validates the user session server-side.
 * Returns the User object if authenticated, otherwise throws an error or sends 401.
 */
export async function authorizeUser(req: NextApiRequest, res: NextApiResponse): Promise<User> {
  // Garantir que as variáveis de ambiente existam
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

  // 1. Tentar autenticação via Cookie (Padrão para Browser)
  try {
    const supabaseHelper = createPagesServerClient(
        { req, res },
        { supabaseUrl, supabaseKey }
    );
    const { data: { session } } = await supabaseHelper.auth.getSession();

    if (session?.user) {
      return session.user;
    }
  } catch (e) {
    console.warn("Cookie auth failed, trying header...", e);
  }

  // 2. Fallback: Tentar autenticação via Header Authorization (Bearer Token)
  // Útil para quando cookies falham ou chamadas de API externas/mobile
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Cliente raw para validar token
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (user && !userError) {
        return user;
    }
  }

  throw new Error('Unauthorized');
}
