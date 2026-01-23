import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

type AuthResult =
  | { ok: true; mode: 'cookie' | 'bearer'; supabase: any; user: any }
  | { ok: false; status: number; body: any };

function getBearerToken(req: Request) {
  const raw = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return { url, anon };
}

export async function getAuthedSupabase(req: Request): Promise<AuthResult> {
  // 1) Tenta cookie (padrão do auth-helpers)
  const supabaseCookie = createRouteHandlerClient({ cookies });

  const { data: cookieData, error: cookieErr } = await supabaseCookie.auth.getUser();
  if (!cookieErr && cookieData?.user) {
    return { ok: true, mode: 'cookie', supabase: supabaseCookie, user: cookieData.user };
  }

  // 2) Tenta Bearer token (para chamadas com Authorization header)
  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      body: { ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' },
    };
  }

  const { url, anon } = getPublicSupabaseEnv();
  if (!url || !anon) {
    return {
      ok: false,
      status: 500,
      body: {
        ok: false,
        code: 'MISSING_ENV',
        message:
          'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY on server.',
      },
    };
  }

  // Cliente com header global Authorization => RLS enxerga o usuário autenticado
  const supabaseBearer = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: bearerData, error: bearerErr } = await supabaseBearer.auth.getUser();
  if (bearerErr || !bearerData?.user) {
    return {
      ok: false,
      status: 401,
      body: { ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' },
    };
  }

  return { ok: true, mode: 'bearer', supabase: supabaseBearer, user: bearerData.user };
}
