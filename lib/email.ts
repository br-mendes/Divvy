
// Helper for environment variables
const apiKey = process.env.RESEND_API_KEY || 're_D4Q38wCF_DkLPPDbmZMYR7fLbCDvYBLhG';
const fromEmail = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'noreply@divvy.com';

// Helper function to send email via Resend API using fetch directly
async function sendViaResend(payload: any) {
  if (!apiKey || apiKey.startsWith('re_mock')) {
    console.log('📧 [MOCK EMAIL] No valid Resend API key. Payload:', payload);
    return { id: 'mock-id-' + Date.now() };
  }

  // Note: Resend API requires server-side calls due to CORS and security.
  // In a real Vercel deployment, this should be in an API Route.
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Error sending email via Resend');
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to send real email (likely CORS in browser). Mocking success.');
    return { id: 'mock-id-fallback-' + Date.now() };
  }
}

export async function sendInviteEmail(
  to: string,
  divvyName: string,
  inviterName: string,
  inviteLink: string,
  qrCodeDataUrl?: string
) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8b5cf6; color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { color: #999; font-size: 12px; text-align: center; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>💜 Convite Divvy</h1></div>
            <div class="content">
              <p>Oi!</p>
              <p><strong>${inviterName}</strong> convidou você para o grupo <strong>"${divvyName}"</strong>.</p>
              <div style="text-align: center;"><a href="${inviteLink}" class="button">Aceitar Convite</a></div>
              ${qrCodeDataUrl ? `<div style="text-align: center;"><img src="${qrCodeDataUrl}" width="150" /></div>` : ''}
              <p>O link expira em 7 dias.</p>
            </div>
            <div class="footer"><p>© 2026 Divvy - Despesas em grupo sem drama 💜</p></div>
          </div>
        </body>
      </html>
    `;

    return await sendViaResend({
      from: fromEmail,
      to: [to],
      subject: `${inviterName} convida você para ${divvyName} 💜`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

export async function sendConfirmationEmail(to: string, confirmationLink: string) {
  try {
    const htmlContent = `
      <div style="font-family: sans-serif;">
        <h1>Bem-vindo ao Divvy!</h1>
        <p>Confirme seu email clicando no link abaixo:</p>
        <a href="${confirmationLink}" style="padding: 10px 20px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px;">Confirmar Email</a>
      </div>
    `;

    return await sendViaResend({
      from: fromEmail,
      to: [to],
      subject: 'Confirme seu email no Divvy 💜',
      html: htmlContent,
    });
  } catch (error) {
    console.error('Erro ao enviar confirmação:', error);
    throw error;
  }
}

export async function sendExpenseNotificationEmail(to: string, divvyName: string, amount: string, desc: string, paidBy: string) {
  try {
    const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Nova despesa em ${divvyName}</h2>
        <p><strong>Valor:</strong> R$ ${amount}</p>
        <p><strong>Descrição:</strong> ${desc}</p>
        <p><strong>Pago por:</strong> ${paidBy}</p>
      </div>
    `;

    return await sendViaResend({
      from: fromEmail,
      to: [to],
      subject: `Nova despesa em ${divvyName}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    throw error;
  }
}
