import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const cookieNames = cookies()
      .getAll()
      .map((c) => c.name);
    const sbCookies = cookieNames.filter((n) => n.startsWith('sb-') || n.includes('supabase'));

    return NextResponse.json({
      ok: true,
      authenticated: !!session,
      email: session?.user?.email ?? null,
      sbCookies,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'UNKNOWN' }, { status: 500 });
  }
}

/**
 * POST /api/auth/session
 * Body: { access_token, refresh_token }
 * Objetivo: gravar cookies HttpOnly do Supabase no dominio,
 * para que middleware (server) reconheca a sessao.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const access_token = body?.access_token;
    const refresh_token = body?.refresh_token;

    if (!access_token || !refresh_token) {
      return NextResponse.json({ ok: false, error: 'MISSING_TOKENS' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      authenticated: !!data.session,
      email: data.session?.user?.email ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'UNKNOWN' }, { status: 500 });
  }
}
