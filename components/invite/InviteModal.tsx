import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import SuccessCheck from '../ui/SuccessCheck';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { getURL } from '../../lib/getURL';
import { sendInviteEmail } from '../../lib/email';

interface InviteModalProps {
  divvyId: string;
  divvyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({
  divvyId,
  divvyName,
  isOpen,
  onClose,
}: InviteModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Check if Divvy exists (simulating backend check)
      const { data: divvy, error: divvyError } = await supabase
        .from('divvies')
        .select('name')
        .eq('id', divvyId)
        .single();

      if (divvyError || !divvy) {
        throw new Error('Divvy não encontrado');
      }

      // 2. Create invite in DB
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('divvy_invites')
        .insert({
          divvy_id: divvyId,
          invited_email: email,
          invited_by_user_id: user.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Generate Link
      const baseUrl = getURL().replace(/\/$/, '');
      const link = `${baseUrl}/join/${data.id}`; // Next.js clean URL
      setInviteLink(link);

      // 4. Generate QR Code
      let qrUrl = '';
      try {
        qrUrl = await QRCode.toDataURL(link);
        setQrCodeUrl(qrUrl);
      } catch (qrError) {
        console.warn('Erro ao gerar QR code:', qrError);
      }
      
      // 5. Send Invite Email (using Resend or Mock)
      const inviterName = user.user_metadata?.full_name || user.email || 'Alguém';
      
      try {
        await sendInviteEmail(
          email,
          divvyName,
          inviterName,
          link,
          qrUrl
        );
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        toast('Convite criado, mas houve erro ao enviar o email.', { icon: '⚠️' });
      }
      
      toast.success('Convite enviado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(inviteLink);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  }

  function handleClose() {
    setInviteLink('');
    setQrCodeUrl('');
    setEmail('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={inviteLink ? 'Convite Gerado!' : `Convidar membro para ${divvyName}`}
    >
      {!inviteLink ? (
        <form onSubmit={handleSendInvite} className="space-y-4">
          <Input
            label="Email do convidado"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="usuario@email.com"
            required
          />
          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              disabled={!email}
            >
              Enviar convite
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <SuccessCheck />
            <p className="text-lg font-bold text-gray-900 mt-2">Convite gerado com sucesso!</p>
            <p className="text-sm text-gray-500 text-center mt-1">
              O convite foi registrado para <strong>{email}</strong>
            </p>
          </div>

          {qrCodeUrl && (
            <div className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <img src={qrCodeUrl} alt="QR Code do Convite" className="w-32 h-32 mb-2" />
              <p className="text-xs text-gray-500">Escaneie para aceitar</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Compartilhe este link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={copyToClipboard}
              >
                {copiedToClipboard ? '✓' : 'Copiar'}
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleClose}
          >
            Concluir
          </Button>
        </div>
      )}
    </Modal>
  );
}