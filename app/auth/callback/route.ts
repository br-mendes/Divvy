import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function safeNextPath(raw: string | null) {
  const v = (raw ?? '').trim();
  if (!v) return '/dashboard';
  if (!v.startsWith('/')) return '/dashboard';
  if (v.startsWith('//')) return '/dashboard';
  return v;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  const next = safeNextPath(url.searchParams.get('next') || url.searchParams.get('redirect'));
  const origin = url.origin;

  const oauthError =
    url.searchParams.get('error_description') ||
    url.searchParams.get('error') ||
    url.searchParams.get('message');

  if (oauthError) {
    const errUrl = new URL('/auth/login', origin);
    errUrl.searchParams.set('error', oauthError);
    return NextResponse.redirect(errUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errUrl = new URL('/auth/login', origin);
    errUrl.searchParams.set('error', 'MISSING_ENV');
    return NextResponse.redirect(errUrl);
  }

  if (!code) {
    const errUrl = new URL('/auth/login', origin);
    errUrl.searchParams.set('error', 'MISSING_CODE');
    return NextResponse.redirect(errUrl);
  }

  // Redirect final (e vamos anexar cookies nele)
  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errUrl = new URL('/auth/login', origin);
    errUrl.searchParams.set('error', error.message || 'OAUTH_EXCHANGE_FAILED');
    return NextResponse.redirect(errUrl);
  }

  return response;
}
