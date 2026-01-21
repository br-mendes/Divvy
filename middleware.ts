import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const isAuth = req.nextUrl.pathname.startsWith('/auth');
  const isDash = req.nextUrl.pathname.startsWith('/dashboard');

  // Rotas protegidas que exigem login
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/profile') ||
    req.nextUrl.pathname.startsWith('/divvy') ||
    req.nextUrl.pathname.startsWith('/admin') ||
    req.nextUrl.pathname.startsWith('/join')
  )) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirecionar usuário logado para fora das páginas de auth
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Proteção adicional para rotas de admin
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
      .maybeSingle();

    if (!admin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
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
    '/signup',
    '/auth/:path*'
  ],
};
