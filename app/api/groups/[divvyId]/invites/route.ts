import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { isSystemAdminEmail } from '@/lib/auth/admin';
import { resend, getAppUrl, getFromEmail } from '@/lib/email/resend';

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  // Auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Permissão: system admin OU creator/admin do grupo
  const { role, isCreator } = await getMyRoleInDivvy(divvyId);
  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canManage = isSystemAdmin || isCreator || role === 'admin';
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Input
  const body = await req.json();
  const invitedEmail = String(body?.email ?? '').trim().toLowerCase();
  const inviteRole = body?.role === 'admin' ? 'admin' : 'member';

  if (!invitedEmail || !invitedEmail.includes('@')) {
    return NextResponse.json({ error: 'email inválido' }, { status: 400 });
  }

  // Dados do grupo (para o email)
  const { data: divvy, error: divvyErr } = await supabase
    .from('divvies')
    .select('id, name')
    .eq('id', divvyId)
    .single();

  if (divvyErr || !divvy) {
    return NextResponse.json({ error: divvyErr?.message ?? 'Grupo não encontrado' }, { status: 404 });
  }

  // Cria o convite no banco
  const { data: invite, error: invErr } = await supabase
    .from('divvyinvites')
    .insert({
      divvyid: divvyId,
      invitedemail: invitedEmail,
      invitedby: session.user.id,
      role: inviteRole,
      status: 'pending',
    })
    .select('id, token, invitedemail, role, status, expiresat, createdat')
    .single();

  if (invErr || !invite) {
    return NextResponse.json({ error: invErr?.message ?? 'Erro ao criar convite' }, { status: 500 });
  }

  // Envia email via Resend
  const inviteUrl = `${getAppUrl()}/invite/${invite.token}`;

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: invitedEmail,
      subject: `Convite para o grupo "${divvy.name}" no Divvy`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Você foi convidado(a) para um grupo no Divvy</h2>
          <p><b>Grupo:</b> ${escapeHtml(divvy.name)}</p>
          <p>Clique no botão abaixo para aceitar o convite:</p>
          <p>
            <a href="${inviteUrl}"
               style="display:inline-block;padding:10px 14px;border-radius:8px;background:#111;color:#fff;text-decoration:none">
              Aceitar convite
            </a>
          </p>
          <p>Ou copie e cole este link:</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          <p style="opacity:.7;font-size:12px">
            Este convite expira automaticamente.
          </p>
        </div>
      `,
    });
  } catch (e: any) {
    // Convite criado com sucesso, mas e-mail falhou
    return NextResponse.json(
      { invite, warning: 'Convite criado, mas falhou o envio de e-mail.' },
      { status: 201 }
    );
  }

  return NextResponse.json({ invite }, { status: 201 });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] as string));
}
