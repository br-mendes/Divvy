
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getURL } from '../../../lib/getURL';
import { Resend } from 'resend';

// Inicializar Resend diretamente aqui
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_D4Q38wCF_DkLPPDbmZMYR7fLbCDvYBLhG';
const resend = new Resend(RESEND_API_KEY);
const FROM_EMAIL = 'nao-responda@divvyapp.online';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Autenticação
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();
    
    const { divvyId, email } = req.body;

    if (!divvyId || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    // 2. Permissão
    const { data: membership, error: memberError } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', divvyId)
      .eq('userid', user.id)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Permissão negada.' });
    }

    // 3. Gerar/Atualizar Token
    const { data: existing } = await supabase
      .from('divvyinvites')
      .select('*')
      .eq('divvyid', divvyId)
      .eq('invitedemail', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    let inviteToken;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); 

    if (existing) {
      inviteToken = existing.id;
      await supabase
        .from('divvyinvites')
        .update({ expiresat: expiresAt, createdat: new Date().toISOString() })
        .eq('id', inviteToken);
    } else {
      inviteToken = uuidv4();
      const { error: insertError } = await supabase.from('divvyinvites').insert({
        id: inviteToken,
        divvyid: divvyId,
        invitedemail: email.toLowerCase(),
        invitedbyuserid: user.id,
        status: 'pending',
        expiresat: expiresAt,
      });
      if (insertError) throw insertError;
    }

    // 4. Dados para o Email
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: inviterProfile } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', user.id).single();
    
    const inviterName = inviterProfile?.displayname || inviterProfile?.fullname || user.email || 'Um amigo';
    const divvyName = divvy?.name || 'Grupo de Despesas';
    
    // DEFINIÇÃO DA URL DE CONVITE: 
    // Prioriza divvyapp.online ou divvy-roan.vercel.app para emails, evitando links de preview quebrados.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://divvyapp.online';
    const inviteLink = `${baseUrl}/join/${inviteToken}`;
    
    let qrCodeDataUrl = '';
    try { qrCodeDataUrl = await QRCode.toDataURL(inviteLink); } catch (e) {}

    // 5. Enviar Email DIRETAMENTE
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { background: #7c3aed; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 40px 30px; text-align: center; }
            .button { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;}
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Convite para o Divvy!</h1></div>
            <div class="content">
              <p>Olá!</p>
              <p><strong>${inviterName}</strong> convidou você para o grupo <strong>"${divvyName}"</strong>.</p>
              <a href="${inviteLink}" class="button">Aceitar Convite</a>
              ${qrCodeDataUrl ? `<div style="margin-top:20px;"><p>Ou escaneie:</p><img src="${qrCodeDataUrl}" width="150" /></div>` : ''}
            </div>
            <div class="footer"><p>© 2026 Divvy</p></div>
          </div>
        </body>
      </html>
    `;

    try {
        const emailData = await resend.emails.send({
            from: `Divvy <${FROM_EMAIL}>`,
            to: email,
            subject: `${inviterName} convidou você para ${divvyName}`,
            html: htmlContent,
        });

        if (emailData.error) {
            console.error("Resend Error:", emailData.error);
            // Retornar sucesso com aviso explícito
            return res.status(200).json({ 
                success: true, 
                inviteLink, 
                warning: `Falha no envio de email: ${emailData.error.message}. Por favor, envie o link manualmente.` 
            });
        }
    } catch (emailErr: any) {
        console.error("Email Exception:", emailErr);
        // Retornar sucesso com aviso explícito
        return res.status(200).json({ 
            success: true, 
            inviteLink, 
            warning: `Erro técnico no email: ${emailErr.message}. Copie o link abaixo.`
        });
    }

    return res.status(200).json({ success: true, inviteLink });

  } catch (error: any) {
    console.error('Invite API Error:', error);
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return res.status(status).json({ error: error.message || 'Erro interno.' });
  }
}
