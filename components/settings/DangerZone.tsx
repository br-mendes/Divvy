
"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { AlertTriangle, LogOut, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DangerZone() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState<'leave_groups' | 'delete_account' | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpen = (act: 'leave_groups' | 'delete_account') => {
    setAction(act);
    setStep(1);
    setConfirmationInput('');
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!action || !user) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (action === 'leave_groups') {
        const res = await fetch('/api/account/leave-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        
        if (!res.ok) throw new Error('Erro ao sair dos grupos.');
        
        toast.success("Você saiu de todos os grupos e excluiu os seus.");
        setModalOpen(false);
        router.push('/dashboard');
      } else if (action === 'delete_account') {
        if (confirmationInput !== 'DELETAR') {
           toast.error("Digite DELETAR para confirmar.");
           setLoading(false);
           return;
        }
        
        const res = await fetch('/api/account/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });

        if (!res.ok) throw new Error('Erro ao excluir conta.');
        
        await signOut();
        toast.success("Conta excluída.");
        router.push('/');
      }
    } catch (error: any) {
      toast.error("Erro: " + error.message);
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 p-6 md:p-8">
       <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-6 flex items-center gap-2">
          <AlertTriangle size={24} />
          Zona de Perigo
       </h2>
       <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Estas ações são destrutivas e não podem ser desfeitas.
       </p>

       <div className="space-y-4">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 gap-4">
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Sair de todos os grupos</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                      Você sairá de grupos onde é membro e <span className="font-bold">excluirá</span> grupos que você criou.
                  </p>
              </div>
              <Button variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 whitespace-nowrap" onClick={() => handleOpen('leave_groups')}>
                  <LogOut size={16} className="mr-2" />
                  Sair de todos
              </Button>
           </div>

           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 gap-4">
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Excluir Conta</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                      Exclui permanentemente sua conta e todos os seus dados.
                  </p>
              </div>
              <Button variant="danger" className="whitespace-nowrap" onClick={() => handleOpen('delete_account')}>
                  <Trash2 size={16} className="mr-2" />
                  Excluir Conta
              </Button>
           </div>
       </div>

       <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirmação de Segurança">
        <div className="space-y-4">
           {step === 1 && (
               <div className="text-center">
                   <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tem certeza absoluta?</h3>
                   <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {action === 'leave_groups' 
                        ? 'Esta ação removerá você de todos os grupos e excluirá permanentemente os grupos que você criou.' 
                        : 'Esta ação excluirá sua conta, perfil, grupos criados e histórico de pagamentos permanentemente.'}
                   </p>
                   <div className="flex gap-3 justify-center">
                       <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                       <Button variant="danger" onClick={handleConfirm}>Continuar</Button>
                   </div>
               </div>
           )}

           {step === 2 && (
               <div className="text-center animate-fade-in-down">
                   <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                       <AlertTriangle className="text-red-600" size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                       {action === 'delete_account' ? 'Última confirmação' : 'Confirmar Saída'}
                   </h3>
                   
                   {action === 'delete_account' ? (
                       <>
                           <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                               Para confirmar, digite <span className="font-mono font-bold select-all">DELETAR</span> no campo abaixo.
                           </p>
                           <Input 
                               value={confirmationInput} 
                               onChange={(e) => setConfirmationInput(e.target.value)}
                               placeholder="DELETAR"
                               className="mb-6 text-center uppercase"
                           />
                       </>
                   ) : (
                       <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                           Clique em confirmar para limpar seus grupos. Não há como desfazer.
                       </p>
                   )}

                   <div className="flex gap-3 justify-center">
                       <Button variant="outline" onClick={() => setModalOpen(false)} disabled={loading}>Cancelar</Button>
                       <Button 
                            variant="danger" 
                            onClick={handleConfirm} 
                            isLoading={loading}
                            disabled={action === 'delete_account' && confirmationInput !== 'DELETAR'}
                        >
                           {action === 'delete_account' ? 'Excluir Definitivamente' : 'Confirmar'}
                       </Button>
                   </div>
               </div>
           )}
        </div>
      </Modal>
    </div>
  );
}
