
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

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

  // Redirecionar usuário logado para fora das páginas de auth
  if (session && (
    req.nextUrl.pathname === '/login' ||
    req.nextUrl.pathname === '/signup'
  )) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Proteção adicional para rotas de admin
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    const adminEmails = ['brunoafonso.mendes@gmail.com', 'falecomdivvy@gmail.com'];
    const isEmailAdmin = adminEmails.includes(session.user.email || '');
    if (!isEmailAdmin) {
      const { data: profile } = await supabase
        .from('userprofiles')
        .select('is_super_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_super_admin) {
        return NextResponse.redirect(new URL('/', req.url));
      }
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
    '/signup'
  ],
};
