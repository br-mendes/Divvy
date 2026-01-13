
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL;

if (!API_KEY) {
  throw new Error('Missing env RESEND_API_KEY');
}

if (!FROM_EMAIL) {
  throw new Error('Missing env NEXT_PUBLIC_RESEND_FROM_EMAIL');
}

const resend = new Resend(API_KEY);

// CONFIGURAÇÃO CRÍTICA DE DNS:
// Baseado nos seus registros DNS (MX "send" e TXT "send"), você configurou o subdomínio 'send'.
// Portanto, o email DEVE sair de @send.divvyapp.online para ser assinado corretamente pelo DKIM/SPF.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando (to, subject, html)' });
  }

  try {
    const data = await resend.emails.send({
      from: `Divvy <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (data.error) {
        console.error('Resend API Error Payload:', data.error);
        throw new Error(data.error.message);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Falha no envio de email:', error);
    return res.status(500).json({ 
      error: error.message || 'Falha ao enviar email',
      details: 'Verifique se o domínio send.divvyapp.online está com status "Verified" no painel do Resend.'
    });
  }
}
