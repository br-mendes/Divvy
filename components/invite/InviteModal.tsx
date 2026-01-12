
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import SuccessCheck from '../ui/SuccessCheck';
import toast from 'react-hot-toast';
import { Copy, Share2, Send } from 'lucide-react';
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setTimeout(() => {
            setInviteLink('');
            setQrCodeUrl('');
            setEmail('');
        }, 300);
    }
  }, [isOpen]);

  // Generate QR Code when invite link is available
  useEffect(() => {
    if (inviteLink) {
        QRCode.toDataURL(inviteLink)
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error("Error generating QR", err));
    }
  }, [inviteLink]);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Chamada para a API Route Segura
      const response = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divvyId,
          invitedByUserId: user.id,
          email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convite');
      }

      setInviteLink(data.inviteLink);
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
    toast.success('Link copiado!');
  }

  function handleClose() {
    onClose();
  }

  const handleWhatsApp = () => {
    const text = `Venha participar do grupo "${divvyName}" no Divvy! ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelegram = () => {
    const text = `Venha participar do grupo "${divvyName}" no Divvy!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`, '_blank');
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
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">Convite enviado!</p>
            <p className="text-sm text-gray-500 text-center mb-4">Um email foi enviado para {email}.</p>
            
            {qrCodeUrl && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                    <img src={qrCodeUrl} alt="QR Code do Convite" className="w-40 h-40" />
                </div>
            )}
            <p className="text-xs text-gray-400">Escaneie para entrar no grupo</p>
          </div>

          <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={copyToClipboard}
              >
                {copiedToClipboard ? 'Copiado' : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-200 font-semibold"
            >
              <Share2 size={18} /> Compartilhar no WhatsApp
            </button>
            <button
              onClick={handleTelegram}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors border border-blue-200 font-semibold"
            >
              <Send size={18} /> Compartilhar no Telegram
            </button>
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
