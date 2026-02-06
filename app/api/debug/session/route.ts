import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'MISSING_ENV_SERVER_CLIENT' }, { status: 500 });
  }

  const cookieStore = cookies();
  const allCookieNames = cookieStore.getAll().map((c) => c.name);
  const sbCookies = allCookieNames.filter((n) => n.startsWith('sb-') || n.includes('supabase'));

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return NextResponse.json({
    ok: true,
    hasSession: !!session,
    email: session?.user?.email ?? null,
    error: error?.message ?? null,
    sbCookies,
  });
}
