import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string, extra?: any) {
  return NextResponse.json({ ok: false, code, message, ...(extra ?? {}) }, { status });
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return jsonError(401, 'UNAUTHENTICATED', 'You must be logged in');
  }

  const user = auth.user;

  const profileTables = ['userprofiles', 'user_profiles'] as const;
  let profile: any = null;
  let profileTable: string | null = null;
  let lastErr: any = null;

  for (const t of profileTables) {
    const r = await supabase.from(t).select('*').eq('id', user.id).maybeSingle();
    if (!r.error) {
      profile = r.data ?? null;
      profileTable = t;
      lastErr = null;
      break;
    }
    lastErr = r.error;
  }

  return NextResponse.json({
    ok: true,
    user,
    profile,
    profileTable,
    profileError: lastErr?.message ?? null,
    authMode: 'cookie',
  });
}
