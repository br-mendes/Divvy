// Helper for environment variables
const apiKey = process.env.RESEND_API_KEY;

// Helper function to send email via Resend API using fetch directly
// This avoids importing the 'resend' Node.js package which causes issues in browser-only environments via esm.sh
async function sendViaResend(payload: any) {
  if (!apiKey) {
    // Mock successful response if no key is present
    return { id: 'mock-id-' + Date.now() };
  }

  // Note: This will likely fail with CORS if called directly from browser to Resend API
  // unless Resend enables browser access (unlikely for security keys).
  // Ideally this should be called from a Next.js API route.
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
}

/**
 * Enviar email de convite para membro do Divvy
 */
export async function sendInviteEmail(
  to: string,
  divvyName: string,
  inviterName: string,
  inviteLink: string,
  qrCodeDataUrl?: string
) {
  // Mock if API key is missing or client-side restriction prevents sending
  if (!apiKey) {
    console.log('---------------------------------------------------');
    console.log('📧 [MOCK EMAIL] Resend API Key missing or client-side.');
    console.log(`To: ${to}`);
    console.log(`Subject: ${inviterName} convida você para ${divvyName}`);
    console.log(`Link: ${inviteLink}`);
    console.log('---------------------------------------------------');
    return { success: true, data: { id: 'mock-id' } };
  }

  try {
    // Email em HTML puro (para máxima compatibilidade)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background: white;
              border-radius: 8px;
            }
            .header { 
              background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 8px 8px 0 0; 
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 28px; }
            .content { 
              padding: 30px 20px; 
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: #8b5cf6; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold;
              font-size: 16px;
            }
            .button:hover {
              background: #7c3aed;
            }
            .footer { 
              color: #999; 
              font-size: 12px; 
              text-align: center; 
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .qr-code { 
              text-align: center; 
              margin: 30px 0; 
            }
            .qr-code img { 
              max-width: 200px; 
              border: 2px solid #eee;
              border-radius: 4px;
            }
            .link-text {
              word-break: break-all; 
              background: #f9f9f9; 
              padding: 12px; 
              border-radius: 4px; 
              font-size: 12px;
              border: 1px solid #eee;
              color: #666;
            }
            .info-box {
              background: #f0f4ff;
              border-left: 4px solid #8b5cf6;
              padding: 12px;
              border-radius: 4px;
              margin: 15px 0;
              font-size: 14px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💜 Convite Divvy</h1>
            </div>

            <div class="content">
              <p>Oi <strong>${to.split('@')[0]}</strong>!</p>

              <p>
                <strong>${inviterName}</strong> convida você para participar do grupo
                <strong>"${divvyName}"</strong> no Divvy.
              </p>

              <p>
                Divvy é a forma mais fácil e descomplicada de organizar despesas em grupo! 
                Sem drama, sem confusão, sem dor de cabeça.
              </p>

              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">✅ Aceitar Convite</a>
              </div>

              <p style="color: #666; font-size: 14px;">
                Ou copie e cole este link no seu navegador:
              </p>
              <div class="link-text">
                ${inviteLink}
              </div>

              ${
                qrCodeDataUrl
                  ? `
                <div class="qr-code">
                  <p><strong>Ou escaneie o QR code:</strong></p>
                  <img src="${qrCodeDataUrl}" alt="QR Code para aceitar convite" />
                </div>
              `
                  : ''
              }

              <div class="info-box">
                <strong>⏰ Importante:</strong> Este link expira em 7 dias. Aceite o convite em breve!
              </div>

              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Se você não esperava este convite, pode ignorar este email.
              </p>
            </div>

            <div class="footer">
              <p>© 2026 Divvy - Despesas em grupo sem drama 💜</p>
              <p>Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'noreply@divvy.com';

    const data = await sendViaResend({
      from: fromEmail,
      to: [to],
      subject: `${inviterName} convida você para ${divvyName} no Divvy 💜`,
      html: htmlContent,
    });

    console.log('Email enviado com sucesso:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

/**
 * Enviar email de confirmação de registro
 */
export async function sendConfirmationEmail(
  to: string,
  confirmationLink: string
) {
  if (!apiKey) {
    console.log('📧 [MOCK EMAIL] Confirmation link:', confirmationLink);
    return { success: true, data: { id: 'mock-id' } };
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
              background: white;
              border-radius: 8px;
            }
            .header { 
              background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); 
              color: white; 
              padding: 30px 20px; 
              border-radius: 8px 8px 0 0; 
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 28px; }
            .content { 
              padding: 30px 20px; 
            }
            .button { 
              display: inline-block; 
              padding: 14px 32px; 
              background: #8b5cf6; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold;
              font-size: 16px;
            }
            .button:hover {
              background: #7c3aed;
            }
            .footer { 
              color: #999; 
              font-size: 12px; 
              text-align: center; 
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .link-text {
              word-break: break-all; 
              background: #f9f9f9; 
              padding: 12px; 
              border-radius: 4px; 
              font-size: 12px;
              border: 1px solid #eee;
              color: #666;
            }
            .info-box {
              background: #f0f4ff;
              border-left: 4px solid #8b5cf6;
              padding: 12px;
              border-radius: 4px;
              margin: 15px 0;
              font-size: 14px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💜 Bem-vindo ao Divvy</h1>
            </div>

            <div class="content">
              <p>Obrigado por se registrar no Divvy!</p>

              <p>
                Para confirmar seu email e começar a usar o Divvy,
                clique no botão abaixo:
              </p>

              <div style="text-align: center;">
                <a href="${confirmationLink}" class="button">✅ Confirmar Email</a>
              </div>

              <p style="color: #666; font-size: 14px;">
                Ou copie e cole este link:
              </p>
              <div class="link-text">
                ${confirmationLink}
              </div>

              <div class="info-box">
                <strong>⏰ Importante:</strong> Este link expira em 24 horas.
              </div>

              <p style="margin-top: 30px; color: #666;">
                Assim que confirmar seu email, você poderá:
              </p>
              <ul style="color: #666; line-height: 1.8;">
                <li>✨ Criar grupos de despesas (Divvies)</li>
                <li>👥 Convidar amigos e família</li>
                <li>💰 Registrar despesas compartilhadas</li>
                <li>⚖️ Ver automaticamente quem deve quem</li>
              </ul>

              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Se você não criou esta conta, pode ignorar este email.
              </p>
            </div>

            <div class="footer">
              <p>© 2026 Divvy - Despesas em grupo sem drama 💜</p>
              <p>Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'noreply@divvy.com';

    const data = await sendViaResend({
      from: fromEmail,
      to: [to],
      subject: 'Confirme seu email no Divvy 💜',
      html: htmlContent,
    });

    console.log('Email de confirmação enviado:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    throw error;
  }
}

/**
 * Enviar email de notificação de nova despesa
 */
export async function sendExpenseNotificationEmail(
  to: string,
  divvyName: string,
  expenseAmount: string,
  expenseDescription: string,
  paidByName: string
) {
  if (!apiKey) {
    console.log('📧 [MOCK EMAIL] Expense notification');
    console.log(`To: ${to}, Divvy: ${divvyName}, Amount: ${expenseAmount}`);
    return { success: true, data: { id: 'mock-id' } };
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, sans-serif; 
              line-height: 1.6; 
              color: #333; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); 
              color: white; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: center; 
            }
            .content { 
              padding: 20px 0; 
            }
            .expense-box {
              background: #f9f9f9;
              border-left: 4px solid #8b5cf6;
              padding: 15px;
              border-radius: 4px;
              margin: 15px 0;
            }
            .footer { 
              color: #999; 
              font-size: 12px; 
              text-align: center; 
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Nova Despesa no Divvy</h1>
            </div>

            <div class="content">
              <p>Oi!</p>

              <p>
                Uma nova despesa foi adicionada ao grupo <strong>"${divvyName}"</strong>:
              </p>

              <div class="expense-box">
                <p><strong>💰 Valor:</strong> R$ ${expenseAmount}</p>
                <p><strong>📝 Descrição:</strong> ${expenseDescription}</p>
                <p><strong>👤 Pago por:</strong> ${paidByName}</p>
              </div>

              <p>
                Abra o Divvy para ver como a despesa foi dividida e acompanhar seu saldo!
              </p>
            </div>

            <div class="footer">
              <p>© 2026 Divvy - Despesas em grupo sem drama 💜</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'noreply@divvy.com';

    const data = await sendViaResend({
      from: fromEmail,
      to: [to],
      subject: `Nova despesa em ${divvyName}`,
      html: htmlContent,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar notificação de despesa:', error);
    throw error;
  }
}