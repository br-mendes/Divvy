import { resend, EMAIL_FROM, appUrl } from '@/lib/email/resend';

export async function sendRemovalRequestEmail(args: {
  to: string[];
  groupName: string;
  requesterEmail: string;
  targetEmail: string;
  groupId: string;
}) {
  const { to, groupName, requesterEmail, targetEmail, groupId } = args;

  const subject = `Divvy: aprovação para remover membro em "${groupName}"`;
  const link = appUrl(`/groups/${groupId}?tab=requests`);

  const text =
`Olá!

${requesterEmail} solicitou remover ${targetEmail} do grupo "${groupName}".

Abra para aprovar/rejeitar:
${link}
`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
  });
}
