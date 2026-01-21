
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabaseServer';
import { Resend } from 'resend';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'falecomdivvy@gmail.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  const supabase = createServerSupabaseClient();

  try {
    // 1. Salvar no banco de dados
    const { error: dbError } = await supabase.from('supporttickets').insert({
      name,
      email,
      subject,
      message,
      createdat: new Date().toISOString()
    });

    if (dbError) throw dbError;

    // 2. Enviar notificação por email para o suporte (Opcional, mas recomendado)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Divvy Support <onboarding@resend.dev>', // Use seu domínio verificado em produção
        to: SUPPORT_EMAIL,
        subject: `[Suporte] ${subject}`,
        html: `
          <h1>Novo Ticket de Suporte</h1>
          <p><strong>De:</strong> ${name || 'Anônimo'} (${email})</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <hr />
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Support API Error:', error);
    return res.status(500).json({ error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' });
  }
}
