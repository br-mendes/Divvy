
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabaseServer';
import { Resend } from 'resend';

// Chave fornecida para integração
const API_KEY = process.env.RESEND_API_KEY || 're_D4Q38wCF_DkLPPDbmZMYR7fLbCDvYBLhG';
const resend = new Resend(API_KEY);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'falecomdivvy@gmail.com';

// Domínio verificado no DNS (send.divvyapp.online)
const FROM_EMAIL = 'suporte@send.divvyapp.online';

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

    // 2. Enviar notificação por email para o suporte
    // Usamos reply_to para que ao clicar em "Responder", vá para o email do usuário
    if (API_KEY) {
      await resend.emails.send({
        from: `Divvy Support <${FROM_EMAIL}>`, 
        to: SUPPORT_EMAIL,
        reply_to: email, 
        subject: `[Suporte] ${subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="color: #4f46e5;">Novo Ticket de Suporte</h2>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>De:</strong> ${name || 'Anônimo'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Assunto:</strong> ${subject}</p>
            </div>
            <div style="border-left: 4px solid #4f46e5; padding-left: 15px; color: #374151;">
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Support API Error:', error);
    return res.status(500).json({ error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' });
  }
}
