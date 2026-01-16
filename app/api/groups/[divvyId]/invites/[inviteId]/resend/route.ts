import { NextResponse } from 'next/server';

import { isSystemAdminEmail } from '@/lib/auth/admin';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { resend, getAppUrl, getFromEmail } from '@/lib/email/resend';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  _req: Request,
  { params }: { params: { divvyId: string; inviteId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, inviteId } = params;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canManage = isSystemAdmin || isCreator || role === 'admin';
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: divvy, error: divvyErr } = await supabase
    .from('divvies')
    .select('id,name')
    .eq('id', divvyId)
    .single();
  if (divvyErr || !divvy) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });

  const { data: invite, error: invErr } = await supabase
    .from('divvyinvites')
    .select('id, token, invitedemail, role, status, expiresat')
    .eq('id', inviteId)
    .eq('divvyid', divvyId)
    .single();

  if (invErr || !invite) return NextResponse.json({ error: 'Invite não encontrado' }, { status: 404 });

  const expired = new Date(invite.expiresat).getTime() < Date.now();
  if (invite.status !== 'pending' || expired) {
    return NextResponse.json(
      { error: 'Só é possível reenviar convites pendentes e válidos' },
      { status: 400 }
    );
  }

  const inviteUrl = `${getAppUrl()}/invite/${invite.token}`;

  await resend.emails.send({
    from: getFromEmail(),
    to: invite.invitedemail,
    subject: `Lembrete: convite para "${divvy.name}" no Divvy`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2>Você ainda tem um convite pendente no Divvy</h2>
        <p><b>Grupo:</b> ${escapeHtml(divvy.name)}</p>
        <p>Clique para aceitar:</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111;color:#fff;text-decoration:none">Aceitar convite</a></p>
        <p>Ou use este link:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p style="opacity:.7;font-size:12px">Convite expira automaticamente.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] as string)
  );
}
