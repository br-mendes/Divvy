import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  const isAuthRoute = path.startsWith('/auth');
  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/groups') ||
    path.startsWith('/profile') ||
    path.startsWith('/divvy') ||
    path.startsWith('/admin');

  // /join e publico (a pagina ja lida com logado/nao-logado)
  if (!session && isProtected) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirect', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(redirectUrl);
  }

  // se logado e tentar acessar /auth/*, manda para dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // admin guard
  if (session && path.startsWith('/admin')) {
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
    '/groups/:path*',
    '/profile/:path*',
    '/divvy/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/join/:path*',
  ],
};
