import { cookies as nextCookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

type AuthOk = {
  ok: true;
  mode: 'cookie' | 'bearer' | 'cookie-manual';
  supabase: any;
  user: any;
  debug: any;
};
type AuthFail = { ok: false; status: number; body: any };

function pickFirst(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const candidate = (value ?? '').toString().trim();
    if (candidate) return candidate;
  }
  return '';
}

function getPublicSupabaseEnv() {
  const url = pickFirst(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const anon = pickFirst(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
  );
  return { url, anon };
}

function getBearerToken(req: Request) {
  const raw = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!raw) return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function extractAccessTokenFromSbCookie(): {
  found: boolean;
  cookieName?: string;
  accessToken?: string;
  debug: any;
} {
  const store = nextCookies();
  const all = store.getAll();

  const sb = all.find(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'),
  );
  if (!sb) {
    return {
      found: false,
      debug: {
        cookieCount: all.length,
        hasSbAuthCookie: false,
        cookieNames: all.map((cookie) => cookie.name).slice(0, 25),
      },
    };
  }

  // O valor costuma ser encodeURIComponent(JSON.stringify([access_token, refresh_token, ...]))
  let decoded = sb.value;
  try {
    decoded = decodeURIComponent(sb.value);
  } catch {
    // ignore
  }

  try {
    const parsed: any = JSON.parse(decoded);

    // Formatos comuns:
    // 1) ["access", "refresh", ...]
    // 2) { access_token: "...", refresh_token: "..." }
    const access =
      (Array.isArray(parsed) ? parsed?.[0] : parsed?.access_token) ||
      (typeof parsed === 'string' ? parsed : '');

    const accessToken = (access ?? '').toString().trim();

    return {
      found: true,
      cookieName: sb.name,
      accessToken: accessToken || undefined,
      debug: {
        cookieName: sb.name,
        parsedType: Array.isArray(parsed) ? 'array' : typeof parsed,
        accessTokenPresent: !!accessToken,
      },
    };
  } catch (error: any) {
    return {
      found: true,
      cookieName: sb.name,
      accessToken: undefined,
      debug: {
        cookieName: sb.name,
        parseError: error?.message ?? String(error),
      },
    };
  }
}

async function userFromBearer(token: string) {
  const { url, anon } = getPublicSupabaseEnv();
  if (!url || !anon) {
    return {
      ok: false as const,
      status: 500,
      body: {
        ok: false,
        code: 'MISSING_ENV',
        message: 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY on server.',
      },
    };
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      ok: false as const,
      status: 401,
      body: { ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' },
    };
  }

  return { ok: true as const, supabase, user: data.user };
}

export async function getAuthedSupabase(req: Request): Promise<AuthOk | AuthFail> {
  const debugBase = {
    hasAuthHeader: !!(req.headers.get('authorization') || req.headers.get('Authorization')),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    userAgent: req.headers.get('user-agent'),
  };

  // 1) Tenta cookie via auth-helpers
  const supabaseCookie = createRouteHandlerClient({ cookies: nextCookies });

  const { data: cookieData, error: cookieErr } = await supabaseCookie.auth.getUser();
  if (!cookieErr && cookieData?.user) {
    return {
      ok: true,
      mode: 'cookie',
      supabase: supabaseCookie,
      user: cookieData.user,
      debug: { ...debugBase, cookieMode: 'auth-helpers' },
    };
  }

  // 2) Tenta Bearer header
  const bearer = getBearerToken(req);
  if (bearer) {
    const viaBearer = await userFromBearer(bearer);
    if (viaBearer.ok) {
      return {
        ok: true,
        mode: 'bearer',
        supabase: viaBearer.supabase,
        user: viaBearer.user,
        debug: { ...debugBase, bearerMode: 'auth-header' },
      };
    }
  }

  // 3) Fallback: extrai access_token do cookie sb-*-auth-token manualmente
  const extracted = extractAccessTokenFromSbCookie();
  if (extracted.found && extracted.accessToken) {
    const viaCookieManual = await userFromBearer(extracted.accessToken);
    if (viaCookieManual.ok) {
      return {
        ok: true,
        mode: 'cookie-manual',
        supabase: viaCookieManual.supabase,
        user: viaCookieManual.user,
        debug: { ...debugBase, cookieMode: 'manual', extracted: extracted.debug },
      };
    }
  }

  // Falhou: devolve debug útil (sem token)
  return {
    ok: false,
    status: 401,
    body: {
      ok: false,
      code: 'UNAUTHENTICATED',
      message: 'You must be logged in',
      debug: {
        ...debugBase,
        cookieErr: cookieErr?.message ?? null,
        sbCookie: extracted.debug,
        bearerTried: !!bearer,
      },
    },
  };
}
