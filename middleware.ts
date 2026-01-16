import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const isAuth = req.nextUrl.pathname.startsWith('/auth');
  const isDash = req.nextUrl.pathname.startsWith('/dashboard');

  if (!session && isDash) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  if (session && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return res;
}

export const config = { matcher: ['/dashboard/:path*', '/auth/:path*'] };
