
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ShieldCheck, Smartphone, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

export default function Security2FAForm() {
  const { user } = useAuth();
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isMfaSetupOpen, setIsMfaSetupOpen] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchMfaFactors();
  }, [user]);

  const fetchMfaFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data.totp || []);
    } catch (e) {
      console.error("Erro ao buscar fatores MFA", e);
    }
  };

  const handleEnrollMfa = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;

      setMfaFactorId(data.id);
      setMfaSecret(data.totp.secret);
      
      const qrCodeUrl = await QRCode.toDataURL(data.totp.uri);
      setMfaQrCode(qrCodeUrl);
      
      setIsMfaSetupOpen(true);
    } catch (error: any) {
      toast.error("Erro ao iniciar configuração 2FA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaVerifyCode,
      });

      if (error) throw error;

      await supabase.from('userprofiles').update({ twofactorenabled: true }).eq('id', user?.id);

      toast.success("2FA Ativado com sucesso!");
      setIsMfaSetupOpen(false);
      setMfaVerifyCode('');
      fetchMfaFactors();
    } catch (error: any) {
      toast.error("Código inválido ou erro na verificação.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollMfa = async (factorId: string) => {
    if (!confirm("Tem certeza que deseja desativar a autenticação de dois fatores?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      await supabase.from('userprofiles').update({ twofactorenabled: false }).eq('id', user?.id);

      toast.success("2FA Desativado.");
      fetchMfaFactors();
    } catch (error: any) {
      toast.error("Erro ao desativar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ShieldCheck size={24} className="text-brand-600" />
          Segurança
      </h2>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl gap-4">
         <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
               Autenticação de Dois Fatores (2FA)
               {mfaFactors.length > 0 ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Ativado</span>
               ) : (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">Desativado</span>
               )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
               Adicione uma camada extra de segurança exigindo um código do seu aplicativo autenticador.
            </p>
         </div>
         
         <div>
            {mfaFactors.length > 0 ? (
               <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleUnenrollMfa(mfaFactors[0].id)} isLoading={loading}>
                  Desativar 2FA
               </Button>
            ) : (
               <Button onClick={handleEnrollMfa} isLoading={loading}>
                  Ativar 2FA
               </Button>
            )}
         </div>
      </div>

      <Modal isOpen={isMfaSetupOpen} onClose={() => setIsMfaSetupOpen(false)} title="Configurar 2FA">
        <div className="space-y-6">
           <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-4">
                 <Smartphone size={24} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                 Escaneie o QR Code com seu app autenticador.
              </p>
           </div>
           
           <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg">
               {mfaQrCode && (
                   <img src={mfaQrCode} alt="QR Code 2FA" className="w-40 h-40 mb-4 bg-white p-2 rounded" />
               )}
               <div className="w-full">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-1">Ou código manual:</p>
                  <div className="flex items-center gap-2 bg-white dark:bg-dark-900 p-2 border border-gray-200 dark:border-dark-700 rounded">
                     <code className="text-xs font-mono text-gray-800 dark:text-gray-200 flex-1 text-center select-all">{mfaSecret}</code>
                     <button onClick={() => { navigator.clipboard.writeText(mfaSecret); toast.success("Copiado!"); }} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded">
                        <Copy size={14} className="text-gray-500" />
                     </button>
                  </div>
               </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Digite o código de 6 dígitos:</label>
              <Input 
                 placeholder="000 000"
                 value={mfaVerifyCode}
                 onChange={(e) => setMfaVerifyCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                 className="text-center text-2xl tracking-widest font-mono"
                 autoFocus
              />
           </div>

           <Button fullWidth onClick={handleVerifyMfa} isLoading={loading} disabled={mfaVerifyCode.length !== 6}>
              Verificar e Ativar
           </Button>
        </div>
      </Modal>
    </div>
  );
}
