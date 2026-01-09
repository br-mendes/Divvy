import { Resend } from 'resend';

// Helper for Vite environment variables
const getEnv = (key: string) => {
  try {
    // Check both standard and VITE_ prefixed variables
    // @ts-ignore
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  } catch {
    return undefined;
  }
};

const apiKey = getEnv('RESEND_API_KEY');
// Initialize with a placeholder if missing to avoid immediate crash
const resend = new Resend(apiKey || 're_123456789');

export async function sendInviteEmail(
  to: string,
  divvyName: string,
  inviterName: string,
  inviteLink: string,
  qrCodeDataUrl?: string
) {
  // If no API key is present, or we are on the client (where CORS might block it),
  // we mock the success to prevent the UI from breaking during demos.
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
            body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { padding: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .qr-code img { max-width: 200px; }
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
                <strong>${divvyName}</strong> no Divvy.
              </p>

              <p>Divvy é a forma mais fácil de organizar despesas em grupo!</p>

              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">✅ Aceitar Convite</a>
              </p>

              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${inviteLink}
              </p>

              ${
                qrCodeDataUrl
                  ? `
                <div class="qr-code">
                  <p>Ou escaneie o QR code:</p>
                  <img src="${qrCodeDataUrl}" alt="QR Code" />
                </div>
              `
                  : ''
              }

              <p style="color: #666; font-size: 14px;">
                Este link expira em 7 dias.
              </p>
            </div>

            <div class="footer">
              <p>© 2026 Divvy. Todos os direitos reservados.</p>
              <p>Organizar despesas em grupo sem drama 💜</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = getEnv('RESEND_FROM_EMAIL') || 'noreply@divvy.com';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `${inviterName} convida você para ${divvyName} no Divvy`,
      html: htmlContent,
    });

    if (error) {
      console.error('Erro ao enviar email com Resend:', error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    // Fallback logic could go here, but for now we rethrow or handle silently
    throw error;
  }
}

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
            body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .content { padding: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💜 Bem-vindo ao Divvy</h1>
            </div>

            <div class="content">
              <p>Obrigado por se registrar no Divvy!</p>

              <p>Para confirmar seu email, clique no botão abaixo:</p>

              <p style="text-align: center;">
                <a href="${confirmationLink}" class="button">✅ Confirmar Email</a>
              </p>

              <p>Ou copie e cole este link:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${confirmationLink}
              </p>

              <p style="color: #666; font-size: 14px;">
                Este link expira em 24 horas.
              </p>
            </div>

            <div class="footer">
              <p>© 2026 Divvy. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = getEnv('RESEND_FROM_EMAIL') || 'noreply@divvy.com';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Confirme seu email no Divvy',
      html: htmlContent,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    throw error;
  }
}
