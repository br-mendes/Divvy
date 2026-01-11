
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

      // 1. Create invite via RPC (upsert)
      const { data: inviteId, error } = await supabase.rpc('upsert_divvy_invite', {
        p_divvy_id: divvyId,
        p_invited_by_user_id: user.id,
        p_invited_email: email
      });

      if (error) throw error;
      if (!inviteId) throw new Error("Falha ao gerar ID do convite");

      // 2. Generate Link
      const baseUrl = getURL().replace(/\/$/, '');
      const link = `${baseUrl}/join/${inviteId}`; // Next.js clean URL
      setInviteLink(link);

      // 3. Generate QR Code
      let qrUrl = '';
      try {
        qrUrl = await QRCode.toDataURL(link);
        setQrCodeUrl(qrUrl);
      } catch (qrError) {
        console.warn('Erro ao gerar QR code:', qrError);
      }
      
      // 4. Send Invite Email
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

  // --- Social Sharing Helpers ---
  const shareText = `Venha participar do grupo "${divvyName}" no Divvy!`;

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + inviteLink)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async (platformName: string) => {
    // Tenta usar o compartilhamento nativo do celular (comum para Instagram/Messenger)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite Divvy',
          text: shareText,
          url: inviteLink,
        });
        return;
      } catch (error) {
        // Usuário cancelou ou erro, fallback para copiar
        console.log('Share cancelled');
      }
    }
    
    // Fallback: Copia e avisa
    copyToClipboard();
    toast.success(`Link copiado! Cole no ${platformName}.`, { 
        icon: '📋',
        duration: 4000 
    });
  };

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
          </div>

          {qrCodeUrl && (
            <div className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <img src={qrCodeUrl} alt="QR Code do Convite" className="w-32 h-32 mb-2" />
              <p className="text-xs text-gray-500">Escaneie para aceitar</p>
            </div>
          )}

          {/* Social Share Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>

            <button
              onClick={() => handleNativeShare('Instagram')}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors border border-pink-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-xs font-semibold">Instagram</span>
            </button>

            <button
              onClick={() => handleNativeShare('Messenger')}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.8 1.34 5.3 3.52 7.02l-.65 2.76 3.01-1.2c.98.27 2.03.42 3.12.42 5.52 0 10-4.14 10-9.25S17.52 2 12 2zm1.09 11.33l-2.47-2.64-4.8 2.64 5.27-5.59 2.48 2.64 4.81-2.64-5.29 5.59z" />
              </svg>
              <span className="text-xs font-semibold">Messenger</span>
            </button>
          </div>

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
