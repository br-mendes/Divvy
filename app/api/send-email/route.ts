import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const API_KEY = process.env.RESEND_API_KEY || 're_D4Q38wCF_DkLPPDbmZMYR7fLbCDvYBLhG';

const resend = new Resend(API_KEY);

const FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'nao-responda@send.divvyapp.online';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando (to, subject, html)' }, { status: 400 });
    }

    if (!API_KEY) {
      console.error('RESEND_API_KEY não configurada.');
      return NextResponse.json({ error: 'Configuração de email pendente no servidor.' }, { status: 500 });
    }

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

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Falha no envio de email:', error);
    return NextResponse.json({
      error: error.message || 'Falha ao enviar email',
      details: 'Verifique se o domínio send.divvyapp.online está com status "Verified" no painel do Resend.',
    }, { status: 500 });
  }
}
