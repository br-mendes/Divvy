import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

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
      // Assuming a client-side route like /join/:inviteId will handle acceptance
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/join/${data.id}`;
      setInviteLink(link);

      // 4. Generate QR Code
      try {
        const qrUrl = await QRCode.toDataURL(link);
        setQrCodeUrl(qrUrl);
      } catch (qrError) {
        console.warn('Erro ao gerar QR code:', qrError);
      }
      
      // 5. Simulate Email Sending
      // In a real server environment, we would call sendInviteEmail here.
      // Since we are client-side, we just notify success.
      console.log(`[SIMULATION] Email sent to ${email} with link ${link}`);
      
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
      title={`Convidar membro para ${divvyName}`}
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
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-2 font-medium">✅ Convite gerado!</p>
            <p className="text-xs text-green-600">
              Convite para <strong>{email}</strong> registrado.
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
            Fechar
          </Button>
        </div>
      )}
    </Modal>
  );
}