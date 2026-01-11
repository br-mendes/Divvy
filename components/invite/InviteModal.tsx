
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
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.572 1.973.911 3.033.911 3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.77-5.994-5.794zm11.244 3.752c0 1.454-.346 2.873-.995 4.117 2.368 4.412 3.151 5.472 2.765 6.244-.606 1.218.445.068-.002.08-.002.003-2.733 1.444-4.833 3.313l-1.42 2.585-3.048-1.503-2.193 3.655-3.268-6.108-6.287 3.32c-2.128-1.353-4.875-.789-7.147 1.485-2.271-2.275-2.84-5.018-1.487-7.148l-3.32-6.288 6.107-3.269-3.654-2.192 1.503-3.048 2.585-1.421 2.28-4.898 3.525.063c-.012-.448 1.138.604-.08-.002.772-.386 1.832.397 6.244 2.765 1.244-.65 2.664-.995 4.117-.995 4.965 0 9.006 4.041 9.006 9.006zM12.032 4.48c-4.114 0-7.46 3.346-7.461 7.458.001 1.634.526 2.924 1.258 4.17l-1.637 5.976 6.115-1.604c1.171.639 2.197.942 3.868.942 4.112 0 7.459-3.346 7.459-7.46-.002-4.116-3.352-7.456-7.859-7.482zm4.17 9.876c-.225-.113-1.328-.655-1.533-.73-.205-.075-.354-.112-.504.112s-.578.729-.708.879-.262.168-.486.056c-.224-.112-.945-.349-1.801-1.112-.667-.595-1.117-1.329-1.248-1.554-.131-.225-.014-.346.099-.458.101-.1.224-.262.336-.393.112-.131.149-.224.224-.374s.038-.281-.019-.393c-.056-.113-.505-1.217-.692-1.666-.181-.435-.366-.377-.504-.383-.13-.006-.28-.008-.429-.008-.15 0-.393.056-.599.28-.206.225-.785.767-.785 1.871s.804 2.171.916 2.321c.112.15 1.582 2.415 3.832 3.387 1.336.577 1.859.463 2.518.435.735-.031 1.328-.542 1.514-1.066.187-.524.187-.973.131-1.066-.056-.094-.206-.15-.43-.263z" />
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
