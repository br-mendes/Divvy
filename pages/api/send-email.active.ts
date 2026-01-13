
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

// Em produção, use process.env.RESEND_API_KEY. 
// Chave fornecida anteriormente mantida para funcionamento imediato
const API_KEY = process.env.RESEND_API_KEY || 're_D4Q38wCF_DkLPPDbmZMYR7fLbCDvYBLhG';

const resend = new Resend(API_KEY);

// CONFIGURAÇÃO DE DNS ATUALIZADA:
// O domínio oficial configurado no Resend é 'divvyapp.online'.
// O remetente deve corresponder a este domínio para validação SPF/DKIM.
const FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'nao-responda@divvyapp.online';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando (to, subject, html)' });
  }

  if (!API_KEY) {
    console.error('RESEND_API_KEY não configurada.');
    return res.status(500).json({ error: 'Configuração de email pendente no servidor.' });
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
        
        // Tratamento específico para erros de domínio (SPF/DKIM/Validação)
        if (data.error.message?.includes('domain') || data.error.name === 'validation_error') {
             throw new Error(`Erro de verificação de domínio no Resend. Certifique-se que '${FROM_EMAIL.split('@')[1]}' está verificado e as chaves DNS estão propagadas.`);
        }
        
        throw new Error(data.error.message);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Falha no envio de email:', error);
    return res.status(500).json({ 
      error: error.message || 'Falha ao enviar email',
      details: 'Verifique se o domínio divvyapp.online está com status "Verified" no painel do Resend.'
    });
  }
}
