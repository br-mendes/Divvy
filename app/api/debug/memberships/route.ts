import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json({ ok: false, message: "unauthenticated" }, { status: 401 });
  }

  const userId = authData.user.id;

  const { data, error } = await supabase
    .from("divvy_members")
    .select("divvy_id, user_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    ok: true,
    userId,
    divvy_members: {
      ok: !error,
      error: error?.message ?? null,
      rows: data ?? [],
      count: (data ?? []).length,
    },
  });
}
