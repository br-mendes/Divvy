
// Helper to send email via our own API Route (Server-Side)
async function sendViaApiRoute(payload: { to: string | string[], subject: string, html: string }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error sending email');
    }

    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    // Não retornamos mock aqui para garantir que o usuário saiba que o email falhou
    throw error;
  }
}

export async function sendInviteEmail(
  to: string,
  divvyName: string,
  inviterName: string,
  inviteLink: string,
  qrCodeDataUrl?: string
) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #7c3aed; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 40px 30px; text-align: center; }
          .content p { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
          .button { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.2s; }
          .button:hover { background: #6d28d9; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          .qr-container { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Você foi convidado! 🎉</h1>
          </div>
          <div class="content">
            <p>Olá!</p>
            <p><strong>${inviterName}</strong> convidou você para participar do grupo de despesas <strong>"${divvyName}"</strong> no Divvy.</p>
            
            <a href="${inviteLink}" class="button">Aceitar Convite</a>
            
            ${qrCodeDataUrl ? `
              <div style="margin-top: 30px;">
                <p style="font-size: 14px; margin-bottom: 10px;">Ou escaneie com seu celular:</p>
                <div class="qr-container">
                  <img src="${qrCodeDataUrl}" width="150" height="150" alt="QR Code" style="display: block;" />
                </div>
              </div>
            ` : ''}
            
            <p style="font-size: 12px; margin-top: 30px;">Este link expira em 7 dias.</p>
          </div>
          <div class="footer">
            <p>© 2026 Divvy. Gestão inteligente de despesas.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendViaApiRoute({
    to,
    subject: `${inviterName} convidou você para ${divvyName} no Divvy`,
    html: htmlContent,
  });
}

export async function sendConfirmationEmail(to: string, confirmationLink: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #7c3aed;">Bem-vindo ao Divvy! 🚀</h1>
      <p>Obrigado por criar sua conta. Para garantir a segurança dos seus dados, por favor confirme seu endereço de e-mail.</p>
      <p style="margin: 30px 0;">
        <a href="${confirmationLink}" style="padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmar meu E-mail</a>
      </p>
      <p style="color: #666; font-size: 14px;">Se você não criou esta conta, pode ignorar este e-mail.</p>
    </div>
  `;

  return await sendViaApiRoute({
    to,
    subject: 'Confirme seu cadastro no Divvy',
    html: htmlContent,
  });
}

export async function sendExpenseNotificationEmail(to: string, divvyName: string, amount: string, desc: string, paidBy: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${divvyName} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${amount}</span></p>
        <p style="margin: 5px 0;"><strong>Descrição:</strong> ${desc}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${paidBy}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;

  return await sendViaApiRoute({
    to,
    subject: `Nova despesa de R$ ${amount} em ${divvyName}`,
    html: htmlContent,
  });
}

export async function sendPaymentSentEmail(to: string, fromName: string, amount: string, divvyName: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${fromName}</strong> marcou um pagamento de <strong>R$ ${amount}</strong> para você no grupo <strong>${divvyName}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;

  return await sendViaApiRoute({
    to,
    subject: `${fromName} enviou R$ ${amount} no Divvy`,
    html: htmlContent,
  });
}

export async function sendPaymentConfirmedEmail(to: string, confirmedBy: string, amount: string, divvyName: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">Pagamento Confirmado ✅</h2>
      <p><strong>${confirmedBy}</strong> confirmou o recebimento do seu pagamento de <strong>R$ ${amount}</strong> no grupo <strong>${divvyName}</strong>.</p>
      <p>Sua dívida foi atualizada.</p>
    </div>
  `;

  return await sendViaApiRoute({
    to,
    subject: `Pagamento de R$ ${amount} confirmado por ${confirmedBy}`,
    html: htmlContent,
  });
}

export async function sendPaymentRejectedEmail(to: string, rejectedBy: string, amount: string, divvyName: string) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Pagamento Recusado ❌</h2>
      <p><strong>${rejectedBy}</strong> recusou seu registro de pagamento de <strong>R$ ${amount}</strong> no grupo <strong>${divvyName}</strong>.</p>
      <p>Entre em contato com o membro para resolver a pendência.</p>
    </div>
  `;

  return await sendViaApiRoute({
    to,
    subject: `Pagamento de R$ ${amount} recusado por ${rejectedBy}`,
    html: htmlContent,
  });
}
