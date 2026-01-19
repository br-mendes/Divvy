import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSystemAdminEmail, SYSTEM_ADMIN_EMAILS } from '@/lib/auth/admin';
import { sendRemovalRequestEmail } from '@/lib/email/requests';

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string; userId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, userId } = params;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reason = body?.reason ? String(body.reason).trim() : null;

  // Carrega group + members/roles
  const { data: group, error: gErr } = await supabase
    .from('divvies')
    .select('id, name, creatorid')
    .eq('id', divvyId)
    .single();
  if (gErr || !group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const { data: members, error: mErr } = await supabase
    .from('divvymembers')
    .select('userid, email, role')
    .eq('divvyid', divvyId);

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const me = members?.find((x: any) => x.userid === session.user.id);
  if (!me && group.creatorid !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isCreator = group.creatorid === session.user.id;
  const isAdmin = me?.role === 'admin';
  const isSystemAdmin = isSystemAdminEmail(session.user.email);

  const target = members?.find((x: any) => x.userid === userId);
  const targetEmail = target?.email ?? userId;

  // Se admin/criador/admin-global -> remove direto
  if (isCreator || isAdmin || isSystemAdmin) {
    const { error: delErr } = await supabase
      .from('divvymembers')
      .delete()
      .eq('divvyid', divvyId)
      .eq('userid', userId);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, mode: 'removed' });
  }

  // Senão: cria request pending
  const { data: created, error: insErr } = await supabase
    .from('divvy_action_requests')
    .insert({
      divvyid: divvyId,
      type: 'remove_member',
      status: 'pending',
      requested_by: session.user.id,
      target_userid: userId,
      reason,
    })
    .select('*')
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Descobrir e-mails dos aprovadores (admins + creator + system admins)
  const approverEmails = new Set<string>();
  (members ?? []).forEach((x: any) => {
    if (x.role === 'admin') approverEmails.add(String(x.email || '').toLowerCase().trim());
  });

  const creatorMember = members?.find((x: any) => x.userid === group.creatorid);
  if (creatorMember?.email) approverEmails.add(String(creatorMember.email).toLowerCase().trim());

  SYSTEM_ADMIN_EMAILS.forEach((e) => approverEmails.add(e));

  const to = Array.from(approverEmails).filter(Boolean);

  // Envia e-mail (best-effort: não quebra se falhar)
  try {
    await sendRemovalRequestEmail({
      to,
      groupName: group.name ?? 'Grupo',
      requesterEmail: session.user.email ?? session.user.id,
      targetEmail,
      groupId: divvyId,
    });
  } catch {}

  return NextResponse.json({ ok: true, mode: 'requested', request: created }, { status: 201 });
}
