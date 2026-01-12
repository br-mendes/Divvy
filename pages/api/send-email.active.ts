
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
// Fallback to Resend's testing domain if no custom domain is configured
const FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields (to, subject, html)' });
  }

  try {
    const data = await resend.emails.send({
      from: `Divvy <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (data.error) {
        throw new Error(data.error.message);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Resend API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
