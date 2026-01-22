import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type CreateGroupBody = {
  name?: string;
  description?: string;
};

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  // Busca grupos onde o usuário é owner OU membro
  // 1) owner
  const { data: owned, error: ownedErr } = await supabase
    .from("divvies")
    .select("id,name,description,owner_id,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (ownedErr) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: ownedErr.message },
      { status: 500 }
    );
  }

  // 2) memberships -> divvies
  const { data: memberRows, error: memErr } = await supabase
    .from("divvy_members")
    .select("divvy_id, role, divvies:divvy_id(id,name,description,owner_id,created_at)")
    .eq("user_id", user.id);

  if (memErr) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: memErr.message },
      { status: 500 }
    );
  }

  const memberDivvies =
    (memberRows ?? [])
      .map((r: any) => r.divvies)
      .filter(Boolean) ?? [];

  // Merge unique por id
  const map = new Map<string, any>();
  for (const g of owned ?? []) map.set(g.id, g);
  for (const g of memberDivvies) map.set(g.id, g);

  const groups = Array.from(map.values()).sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return db - da;
  });

  return NextResponse.json({
    ok: true,
    groups,
    authMode: "cookie",
    source: "divvies/divvy_members",
  });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  let body: CreateGroupBody = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = (body.name ?? "").trim();
  const description = (body.description ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION", message: "name is required" },
      { status: 400 }
    );
  }

  // Cria o grupo como owner
  const { data: created, error: insErr } = await supabase
    .from("divvies")
    .insert({ name, description: description || null, owner_id: user.id })
    .select("id,name,description,owner_id,created_at")
    .single();

  if (insErr || !created) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: insErr?.message ?? "insert failed" },
      { status: 500 }
    );
  }

  // Garante membership do owner (role=admin)
  await supabase.from("divvy_members").insert({
    divvy_id: created.id,
    user_id: user.id,
    role: "admin",
  });

  return NextResponse.json({ ok: true, group: created }, { status: 201 });
}
