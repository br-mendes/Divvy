import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { User, CreditCard, Plus, Trash2, Star, Pencil, X, Camera, Loader2, AlertTriangle, LogOut, ShieldAlert, ShieldCheck, Smartphone, Copy } from 'lucide-react';
import { PaymentMethod, Bank } from '../types';
import { POPULAR_BANKS } from '../lib/constants';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';

// Mapeamento para exibição amigável
const pixTypeMap: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Aleatória'
};

const accountTypeMap: Record<string, string> = {
  checking: 'Corrente',
  savings: 'Poupança',
  salary: 'Salário',
  payment: 'Pagamento'
};

function ProfileContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  // Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Payment Form State
  const [methodType, setMethodType] = useState<'pix' | 'bank_account'>('pix');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  
  const [selectedBankId, setSelectedBankId] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountDigit, setAccountDigit] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [holderName, setHolderName] = useState('');
  const [holderDoc, setHolderDoc] = useState('');

  // Danger Zone State
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerAction, setDangerAction] = useState<'leave_groups' | 'delete_account' | null>(null);
  const [dangerStep, setDangerStep] = useState<1 | 2>(1);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);

  // --- 2FA STATE ---
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isMfaSetupOpen, setIsMfaSetupOpen] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
      fetchPaymentData();
      fetchMfaFactors();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, nickname, avatar_url')
      .eq('id', user.id)
      .single();

    if (profile && !error) {
      setName(profile.nickname || profile.full_name || user.user_metadata?.full_name || '');
      setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
    } else {
      setName(user.user_metadata?.nickname || user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
    setEmail(user.email || '');
  };

  const fetchMfaFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      // Filtra apenas fatores verificados ('totp')
      setMfaFactors(data.totp || []);
    } catch (e) {
      console.error("Erro ao buscar fatores MFA", e);
    }
  };

  const handleEnrollMfa = async () => {
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;

      setMfaFactorId(data.id);
      setMfaSecret(data.totp.secret);
      
      // Gerar QR Code para exibição
      const qrCodeUrl = await QRCode.toDataURL(data.totp.uri);
      setMfaQrCode(qrCodeUrl);
      
      setIsMfaSetupOpen(true);
    } catch (error: any) {
      toast.error("Erro ao iniciar configuração 2FA: " + error.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }
    setMfaLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaVerifyCode,
      });

      if (error) throw error;

      toast.success("2FA Ativado com sucesso!");
      setIsMfaSetupOpen(false);
      setMfaVerifyCode('');
      fetchMfaFactors();
    } catch (error: any) {
      toast.error("Código inválido ou erro na verificação.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleUnenrollMfa = async (factorId: string) => {
    if (!confirm("Tem certeza que deseja desativar a autenticação de dois fatores? Sua conta ficará menos segura.")) return;
    
    setMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      toast.success("2FA Desativado.");
      fetchMfaFactors();
    } catch (error: any) {
      toast.error("Erro ao desativar: " + error.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAvatarLoading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      if (!user) throw new Error('Usuário não autenticado.');

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
            id: user.id,
            email: user.email,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
      if (!user) return;
      if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) return;
      
      setAvatarLoading(true);
      try {
          const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id,
                email: user.email,
                avatar_url: null,
                updated_at: new Date().toISOString()
            });

          if (error) throw error;
          
          await supabase.auth.updateUser({
             data: { avatar_url: null }
          });

          setAvatarUrl(null);
          toast.success("Foto de perfil removida.");
      } catch (error: any) {
          toast.error("Erro ao remover foto: " + error.message);
      } finally {
          setAvatarLoading(false);
      }
  };

  const fetchPaymentData = async () => {
    if (!user) return;

    try {
        const { data: methods, error } = await supabase.rpc('get_user_payment_methods', {
            p_user_id: user.id
        });

        if (!error && methods) {
            setPaymentMethods(methods as any);
        } else {
            const { data: methodsDirect } = await supabase
              .from('user_payment_methods')
              .select('*, banks(name, short_name)')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .order('is_primary', { ascending: false });
            
            if (methodsDirect) setPaymentMethods(methodsDirect as any);
        }
    } catch (e) {
        console.error("Error fetching payments", e);
    }

    const { data: banksData } = await supabase.from('banks').select('*').order('name');
    if (banksData) setBanks(banksData);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          nickname: name,
        }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: name,
          nickname: name,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenAdd = () => {
      resetPaymentForm();
      setEditingId(null);
      setIsFormOpen(true);
      setTimeout(() => {
        const formElement = document.getElementById('payment-form-section');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setMethodType(method.method_type === 'bank_account' || method.type === 'bank_account' ? 'bank_account' : 'pix');
    
    setPixKey(method.raw_pix_key || method.pix_key || '');
    setPixKeyType((method.pix_key_type as string) || 'cpf');
    
    setSelectedBankId(method.bank_id || '');
    setAgency(method.raw_agency || method.agency || '');
    setAccountNumber(method.raw_account_number || method.account_number || '');
    setAccountDigit(method.raw_account_digit || method.account_digit || '');
    setAccountType((method.account_type as string) || 'checking');
    setHolderName(method.account_holder_name || '');
    setHolderDoc(method.account_holder_document || '');

    setIsFormOpen(true);
    setTimeout(() => {
        const formElement = document.getElementById('payment-form-section');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPaymentLoading(true);

    try {
      const isFirst = paymentMethods.length === 0;

      const payload: any = {
        user_id: user.id,
        type: methodType,
        is_primary: isFirst, 
        is_visible_in_groups: isFirst,
        updated_at: new Date().toISOString()
      };

      if (methodType === 'pix') {
        if (!pixKey) throw new Error("Chave PIX é obrigatória");
        payload.pix_key = pixKey;
        payload.pix_key_type = pixKeyType;
        payload.bank_id = null;
        payload.agency = null;
        payload.account_number = null;
      } else {
        payload.bank_id = selectedBankId || null;
        payload.agency = agency;
        payload.account_number = accountNumber;
        payload.account_digit = accountDigit;
        payload.account_type = accountType;
        payload.account_holder_name = holderName || name;
        payload.account_holder_document = holderDoc;
        payload.pix_key = null;
      }

      if (editingId) {
        delete payload.is_primary;
        delete payload.is_visible_in_groups;

        const { error } = await supabase
            .from('user_payment_methods')
            .update(payload)
            .eq('id', editingId);
        if (error) throw error;
        toast.success('Método atualizado!');
      } else {
        const { error } = await supabase.from('user_payment_methods').insert(payload);
        if (error) throw error;
        toast.success('Método adicionado!');
      }

      setIsFormOpen(false);
      resetPaymentForm();
      fetchPaymentData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteMethod = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este método de pagamento?")) return;
    try {
      const { error } = await supabase.rpc('delete_payment_method', {
          p_payment_method_id: id
      });

      if (error) {
          await supabase.from('user_payment_methods').update({ is_active: false }).eq('id', id);
      }
      
      fetchPaymentData();
      toast.success("Método removido");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const handleSetPrimary = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    if (!user) return;
    
    const newStatus = !currentStatus;
    const loadingToast = toast.loading(newStatus ? 'Definindo como principal...' : 'Removendo principal...');

    try {
        if (newStatus) {
            await supabase
                .from('user_payment_methods')
                .update({ is_primary: false, is_visible_in_groups: false })
                .eq('user_id', user.id);
        }

        const { error } = await supabase
            .from('user_payment_methods')
            .update({ is_primary: newStatus, is_visible_in_groups: newStatus })
            .eq('id', id);

        if (error) throw error;

        toast.success(newStatus ? "Método definido como principal!" : "Método não é mais principal.", { id: loadingToast });
        fetchPaymentData();
    } catch (error: any) {
        toast.error("Erro ao atualizar: " + error.message, { id: loadingToast });
    }
  };

  const resetPaymentForm = () => {
    setPixKey('');
    setAgency('');
    setAccountNumber('');
    setAccountDigit('');
    setHolderName('');
    setHolderDoc('');
    setSelectedBankId('');
    setMethodType('pix');
  };

  // --- DANGER ZONE HANDLERS ---
  const handleOpenDangerModal = (action: 'leave_groups' | 'delete_account') => {
    setDangerAction(action);
    setDangerStep(1);
    setDeleteConfirmationInput('');
    setDangerModalOpen(true);
  };

  const handleDangerConfirm = async () => {
    if (!dangerAction) return;

    // First Step Confirmation
    if (dangerStep === 1) {
      setDangerStep(2);
      return;
    }

    // Second Step Execution
    setDangerLoading(true);
    try {
      if (dangerAction === 'leave_groups') {
        const { error } = await supabase.rpc('delete_all_my_divvies');
        if (error) throw error;
        toast.success("Você saiu de todos os grupos e excluiu os seus.");
        setDangerModalOpen(false);
      } else if (dangerAction === 'delete_account') {
        if (deleteConfirmationInput !== 'DELETAR') {
           toast.error("Digite DELETAR para confirmar.");
           setDangerLoading(false);
           return;
        }
        
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
        
        await signOut();
        toast.success("Conta excluída. Até logo!");
        router.push('/');
        return;
      }
    } catch (error: any) {
      toast.error("Erro ao executar ação: " + error.message);
      setDangerModalOpen(false); // Close on error to reset
    } finally {
      setDangerLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User size={24} className="text-brand-600" />
          Dados Pessoais
        </h2>

        {/* --- Avatar Section --- */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-brand-50 flex items-center justify-center">
               {avatarLoading ? (
                  <Loader2 className="animate-spin text-brand-500 w-10 h-10" />
               ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-4xl text-brand-300 font-bold">
                     {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </span>
               )}
            </div>
            
            <div className="absolute bottom-0 right-0 flex gap-2">
                <label className="p-2 bg-brand-600 text-white rounded-full cursor-pointer hover:bg-brand-700 shadow-md transition-all hover:scale-105" title="Alterar foto">
                    <Camera size={18} />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={avatarLoading}
                    />
                </label>
                {avatarUrl && (
                   <button 
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={avatarLoading}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-md transition-all hover:scale-105"
                      title="Remover foto"
                   >
                      <Trash2 size={18} />
                   </button>
                )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Clique na câmera para alterar</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
                <Input
                  label="Nome ou Apelido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Como será visto nos grupos</p>
            </div>
            <Input
              label="Email"
              value={email}
              disabled
              className="bg-gray-50"
            />
          </div>
          <Button type="submit" isLoading={profileLoading}>
            Salvar Alterações
          </Button>
        </form>
      </div>

      {/* --- SECURITY & 2FA --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldCheck size={24} className="text-brand-600" />
            Segurança
        </h2>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 border border-gray-200 rounded-xl gap-4">
           <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                 Autenticação de Dois Fatores (2FA)
                 {mfaFactors.length > 0 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Ativado</span>
                 ) : (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">Desativado</span>
                 )}
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-lg">
                 Adicione uma camada extra de segurança à sua conta exigindo um código do seu aplicativo autenticador (Google Authenticator, Authy, etc) ao fazer login.
              </p>
           </div>
           
           <div>
              {mfaFactors.length > 0 ? (
                 <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleUnenrollMfa(mfaFactors[0].id)} isLoading={mfaLoading}>
                    Desativar 2FA
                 </Button>
              ) : (
                 <Button onClick={handleEnrollMfa} isLoading={mfaLoading}>
                    Ativar 2FA
                 </Button>
              )}
           </div>
        </div>
      </div>

      {/* --- PAYMENT METHODS --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={24} className="text-brand-600" />
                Métodos de Pagamento
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                O método destacado com estrela (★) será exibido para seus amigos.
            </p>
          </div>
          {!isFormOpen && (
            <Button onClick={handleOpenAdd} variant="outline" size="sm">
              <Plus size={16} className="mr-2" />
              Adicionar
            </Button>
          )}
        </div>

        {isFormOpen && (
          <div id="payment-form-section" className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 animate-fade-in-down scroll-mt-20">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-800">
                  {editingId ? 'Editar Método' : 'Novo Método'}
               </h3>
               <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
               </button>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setMethodType('pix')}
                className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all ${
                  methodType === 'pix' 
                    ? 'bg-brand-50 border-brand-500 text-brand-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                PIX
              </button>
              <button
                type="button"
                onClick={() => setMethodType('bank_account')}
                className={`flex-1 py-3 px-4 rounded-lg border font-medium transition-all ${
                  methodType === 'bank_account' 
                    ? 'bg-brand-50 border-brand-500 text-brand-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Conta Bancária
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4">
              {methodType === 'pix' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chave</label>
                      <select
                        value={pixKeyType}
                        onChange={(e) => setPixKeyType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      >
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">Email</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                       <Input 
                         label="Chave Pix" 
                         value={pixKey} 
                         onChange={(e) => setPixKey(e.target.value)} 
                         placeholder="Informe a chave"
                         required
                       />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                    >
                      <option value="">Selecione um banco</option>
                      {banks.length > 0 ? (
                        banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.code} - {bank.name}</option>
                        ))
                      ) : (
                        POPULAR_BANKS.map(bank => (
                           <option key={bank.code} value={bank.code}>{bank.code} - {bank.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <Input 
                        label="Agência" 
                        value={agency} 
                        onChange={e => setAgency(e.target.value)}
                        placeholder="0000"
                      />
                     <Input 
                        label="Conta" 
                        value={accountNumber} 
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="000000"
                      />
                     <Input 
                        label="Dígito" 
                        value={accountDigit} 
                        onChange={e => setAccountDigit(e.target.value)}
                        placeholder="0"
                        className="md:w-20"
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      >
                        <option value="checking">Conta Corrente</option>
                        <option value="savings">Conta Poupança</option>
                        <option value="salary">Conta Salário</option>
                        <option value="payment">Conta de Pagamento</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Titular (opcional)" 
                      value={holderName} 
                      onChange={e => setHolderName(e.target.value)}
                      placeholder="Se diferente do perfil"
                    />
                    <Input 
                      label="CPF/CNPJ Titular (opcional)" 
                      value={holderDoc} 
                      onChange={e => setHolderDoc(e.target.value)}
                      placeholder="Se diferente do perfil"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit" isLoading={paymentLoading}>Salvar Método</Button>
              </div>
            </form>
          </div>
        )}

        {/* --- GRID LAYOUT FOR CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.length === 0 ? (
            <div className="md:col-span-2 text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Nenhum método de pagamento cadastrado.
            </div>
          ) : (
            paymentMethods.map(method => {
              const isPix = method.type === 'pix' || method.method_type === 'pix' || !!method.pix_key;
              const isPrimary = method.is_primary;

              // Logic for Dynamic Titles
              let title = '';
              if (isPix) {
                const typeLabel = pixTypeMap[method.pix_key_type as string] || 'Chave';
                title = `Pix: ${typeLabel}`;
              } else {
                const typeLabel = accountTypeMap[method.account_type as string] || '';
                title = `Conta ${typeLabel}`;
              }

              return (
              <div 
                key={method.id} 
                className={`
                    relative rounded-xl p-5 border transition-all hover:shadow-md flex flex-col justify-between
                    ${isPrimary 
                        ? 'bg-brand-50/50 border-brand-500 ring-1 ring-brand-500' 
                        : 'bg-white border-gray-200 hover:border-brand-200'
                    }
                `}
              >
                {/* Badge Principal */}
                {isPrimary && (
                    <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
                        Principal
                    </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className={`
                    h-12 w-12 rounded-lg flex items-center justify-center text-2xl shadow-sm
                    ${isPix ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}
                  `}>
                    {isPix ? '💠' : '🏦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate" title={title}>
                          {title}
                      </h3>
                    </div>
                    
                    {!isPix && (
                        <p className="text-sm text-gray-600 mt-1">
                           <span className="font-semibold text-gray-800">{(method as any).bank_name || method.banks?.name}</span>
                           <br />
                           Ag {method.agency} • CC {method.account_number}
                        </p>
                    )}
                    {isPix && (
                        <p className="text-sm text-gray-600 font-mono mt-1 break-all bg-gray-50 px-2 py-1 rounded inline-block">
                           {method.pix_key || method.pix_key_masked}
                        </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                   {/* Botão de Estrela (Favoritar) */}
                   <button 
                      onClick={(e) => handleSetPrimary(e, method.id, isPrimary)}
                      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          isPrimary 
                          ? 'text-brand-700 bg-brand-100 hover:bg-brand-200' 
                          : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      title={isPrimary ? "Remover dos favoritos" : "Definir como principal"}
                   >
                      <Star size={16} fill={isPrimary ? "currentColor" : "none"} />
                      {isPrimary ? 'Principal' : 'Favoritar'}
                   </button>

                   <div className="flex gap-1">
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(method); }}
                          className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Editar"
                       >
                          <Pencil size={18} />
                       </button>

                       <button 
                          onClick={(e) => handleDeleteMethod(e, method.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                       >
                          <Trash2 size={18} />
                       </button>
                   </div>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 md:p-8">
         <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} />
            Zona de Perigo
         </h2>
         <p className="text-gray-600 mb-6 text-sm">
            Estas ações são destrutivas e não podem ser desfeitas. Prossiga com cuidado.
         </p>

         <div className="space-y-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 gap-4">
                <div>
                    <h3 className="font-bold text-gray-900">Sair de todos os grupos</h3>
                    <p className="text-sm text-gray-500">
                        Você sairá de grupos onde é membro e <span className="font-bold">excluirá</span> grupos que você criou.
                    </p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-100 whitespace-nowrap" onClick={() => handleOpenDangerModal('leave_groups')}>
                    <LogOut size={16} className="mr-2" />
                    Sair de todos
                </Button>
             </div>

             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 gap-4">
                <div>
                    <h3 className="font-bold text-gray-900">Excluir Conta</h3>
                    <p className="text-sm text-gray-500">
                        Exclui permanentemente sua conta e todos os seus dados.
                    </p>
                </div>
                <Button variant="danger" className="whitespace-nowrap" onClick={() => handleOpenDangerModal('delete_account')}>
                    <Trash2 size={16} className="mr-2" />
                    Excluir Conta
                </Button>
             </div>
         </div>
      </div>

      {/* --- CONFIRMATION MODAL FOR DANGER ACTIONS --- */}
      <Modal 
        isOpen={dangerModalOpen} 
        onClose={() => setDangerModalOpen(false)} 
        title="Confirmação de Segurança"
      >
        <div className="space-y-4">
           {dangerStep === 1 && (
               <div className="text-center">
                   <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Tem certeza absoluta?</h3>
                   <p className="text-gray-600 mb-6">
                      {dangerAction === 'leave_groups' 
                        ? 'Esta ação removerá você de todos os grupos e excluirá permanentemente os grupos que você criou.' 
                        : 'Esta ação excluirá sua conta, perfil, grupos criados e histórico de pagamentos permanentemente.'}
                   </p>
                   <div className="flex gap-3 justify-center">
                       <Button variant="outline" onClick={() => setDangerModalOpen(false)}>Cancelar</Button>
                       <Button variant="danger" onClick={handleDangerConfirm}>Continuar</Button>
                   </div>
               </div>
           )}

           {dangerStep === 2 && (
               <div className="text-center animate-fade-in-down">
                   <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                       <AlertTriangle className="text-red-600" size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-2">
                       {dangerAction === 'delete_account' ? 'Última confirmação' : 'Confirmar Saída'}
                   </h3>
                   
                   {dangerAction === 'delete_account' ? (
                       <>
                           <p className="text-gray-600 mb-4 text-sm">
                               Para confirmar, digite <span className="font-mono font-bold select-all">DELETAR</span> no campo abaixo.
                           </p>
                           <Input 
                               value={deleteConfirmationInput} 
                               onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                               placeholder="DELETAR"
                               className="mb-6 text-center uppercase"
                           />
                       </>
                   ) : (
                       <p className="text-gray-600 mb-6 text-sm">
                           Clique em confirmar para limpar seus grupos. Não há como desfazer.
                       </p>
                   )}

                   <div className="flex gap-3 justify-center">
                       <Button variant="outline" onClick={() => setDangerModalOpen(false)} disabled={dangerLoading}>Cancelar</Button>
                       <Button 
                            variant="danger" 
                            onClick={handleDangerConfirm} 
                            isLoading={dangerLoading}
                            disabled={dangerAction === 'delete_account' && deleteConfirmationInput !== 'DELETAR'}
                        >
                           {dangerAction === 'delete_account' ? 'Excluir Definitivamente' : 'Confirmar'}
                       </Button>
                   </div>
               </div>
           )}
        </div>
      </Modal>

      {/* --- MODAL CONFIGURAÇÃO 2FA --- */}
      <Modal 
        isOpen={isMfaSetupOpen} 
        onClose={() => setIsMfaSetupOpen(false)} 
        title="Configurar 2FA"
      >
        <div className="space-y-6">
           <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                 <Smartphone size={24} />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                 Escaneie o QR Code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, Microsoft Authenticator).
              </p>
           </div>
           
           <div className="flex flex-col items-center p-4 bg-gray-50 border rounded-lg">
               {mfaQrCode ? (
                   <img src={mfaQrCode} alt="QR Code 2FA" className="w-40 h-40 mb-4 bg-white p-2 rounded" />
               ) : (
                   <div className="w-40 h-40 bg-gray-200 animate-pulse rounded mb-4"></div>
               )}
               
               <div className="w-full">
                  <p className="text-xs text-center text-gray-500 mb-1">Ou digite o código manualmente:</p>
                  <div className="flex items-center gap-2 bg-white p-2 border rounded">
                     <code className="text-xs font-mono text-gray-800 flex-1 text-center select-all">{mfaSecret}</code>
                     <button onClick={() => { navigator.clipboard.writeText(mfaSecret); toast.success("Copiado!"); }} className="p-1 hover:bg-gray-100 rounded">
                        <Copy size={14} className="text-gray-500" />
                     </button>
                  </div>
               </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Digite o código de 6 dígitos gerado:</label>
              <Input 
                 placeholder="000 000"
                 value={mfaVerifyCode}
                 onChange={(e) => setMfaVerifyCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                 className="text-center text-2xl tracking-widest font-mono"
                 autoFocus
              />
           </div>

           <Button fullWidth onClick={handleVerifyMfa} isLoading={mfaLoading} disabled={mfaVerifyCode.length !== 6}>
              Verificar e Ativar
           </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}