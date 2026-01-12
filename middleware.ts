
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fallback values must match those in lib/supabase.ts
const DEFAULT_URL = 'https://jpgifiumxqzbroejhudc.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Garantir que as variáveis de ambiente existam para o Auth Helper
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = DEFAULT_URL;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = DEFAULT_KEY;
  }

  const supabase = createMiddlewareClient(
    { req, res },
    { 
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, 
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rotas protegidas que exigem login
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/profile') ||
    req.nextUrl.pathname.startsWith('/divvy') ||
    req.nextUrl.pathname.startsWith('/admin') ||
    req.nextUrl.pathname.startsWith('/join')
  )) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Proteção específica para rota de Admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (session?.user?.email !== 'falecomdivvy@gmail.com') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Redirecionar usuário logado para fora das páginas de auth
  if (session && (
    req.nextUrl.pathname === '/login' ||
    req.nextUrl.pathname === '/signup'
  )) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/profile/:path*', 
    '/divvy/:path*', 
    '/admin/:path*',
    '/join/:path*',
    '/login',
    '/signup'
  ],
};
