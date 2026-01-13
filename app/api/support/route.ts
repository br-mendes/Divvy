import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'falecomdivvy@gmail.com';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error: dbError } = await supabase.from('supporttickets').insert({
      name,
      email,
      subject,
      message,
      createdat: new Date().toISOString(),
    });

    if (dbError) throw dbError;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Divvy Support <onboarding@resend.dev>',
        to: SUPPORT_EMAIL,
        subject: `[Suporte] ${subject}`,
        html: `
          <h1>Novo Ticket de Suporte</h1>
          <p><strong>De:</strong> ${name || 'Anônimo'} (${email})</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <hr />
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Support API Error:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' }, { status: 500 });
  }
}
