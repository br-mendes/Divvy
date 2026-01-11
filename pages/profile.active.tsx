
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { User, CreditCard, Plus, Trash2, Star, Pencil, X } from 'lucide-react';
import { PaymentMethod, Bank } from '../types';
import { POPULAR_BANKS } from '../lib/constants';

function ProfileContent() {
  const { user } = useAuth();
  
  // Profile State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Payment State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Track which ID is being edited
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

  useEffect(() => {
    if (user) {
      loadProfileData();
      fetchPaymentData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    // First try to load from public profiles table (source of truth for groups)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, nickname')
      .eq('id', user.id)
      .single();

    if (profile) {
      setName(profile.full_name || user.user_metadata?.full_name || '');
      setNickname(profile.nickname || user.user_metadata?.nickname || '');
    } else {
      // Fallback to auth metadata
      setName(user.user_metadata?.full_name || '');
      setNickname(user.user_metadata?.nickname || '');
    }
    setEmail(user.email || '');
  };

  const fetchPaymentData = async () => {
    if (!user) return;

    try {
        // Tenta buscar via RPC primeiro (mais robusto e formatado)
        const { data: methods, error } = await supabase.rpc('get_user_payment_methods', {
            p_user_id: user.id
        });

        if (!error && methods) {
            setPaymentMethods(methods as any);
        } else {
            // Fallback para select direto caso RPC falhe ou não exista
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

    // Fetch banks
    const { data: banksData } = await supabase.from('banks').select('*').order('name');
    if (banksData) setBanks(banksData);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);

    try {
      // 1. Update Auth Metadata (Used for session)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          nickname: nickname,
        }
      });
      if (authError) throw authError;

      // 2. Update Public Profiles Table (Used for Divvy Groups display)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: name,
          nickname: nickname,
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
      // Scroll to form
      setTimeout(() => {
        const formElement = document.getElementById('payment-form-section');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setMethodType(method.method_type === 'bank_account' || method.type === 'bank_account' ? 'bank_account' : 'pix');
    
    // Pix Fields
    setPixKey(method.raw_pix_key || method.pix_key || '');
    setPixKeyType((method.pix_key_type as string) || 'cpf');
    
    // Bank Fields
    setSelectedBankId(method.bank_id || '');
    setAgency(method.raw_agency || method.agency || '');
    setAccountNumber(method.raw_account_number || method.account_number || '');
    setAccountDigit(method.raw_account_digit || method.account_digit || '');
    setAccountType((method.account_type as string) || 'checking');
    setHolderName(method.account_holder_name || '');
    setHolderDoc(method.account_holder_document || '');

    setIsFormOpen(true);
    
    // Scroll to form
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
      // Se for o primeiro método, ele é Primary e Visible.
      // Se não for o primeiro, ele nasce oculto (não principal), a menos que o usuário o marque depois.
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
        // Limpar campos de banco
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
        // Limpar campos pix
        payload.pix_key = null;
      }

      if (editingId) {
        // UPDATE
        // Ao editar, não mudamos o status de is_primary a menos que fosse lógica explícita.
        // Mantemos o que estava no banco (o update parcial do supabase cuidaria disso se não enviássemos,
        // mas aqui estamos enviando o payload reconstruído, então cuidado).
        
        // Removemos is_primary/is_visible do payload de update para não sobrescrever o estado atual acidentalmente,
        // a menos que queiramos forçar algo. Vamos deixar o usuário controlar isso pelo botão de estrela.
        delete payload.is_primary;
        delete payload.is_visible_in_groups;

        const { error } = await supabase
            .from('user_payment_methods')
            .update(payload)
            .eq('id', editingId);
        if (error) throw error;
        toast.success('Método atualizado!');
      } else {
        // INSERT
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
          // Fallback manual update
          await supabase.from('user_payment_methods').update({ is_active: false }).eq('id', id);
      }
      
      fetchPaymentData();
      toast.success("Método removido");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  // Regra de Negócio: O principal é o ÚNICO visível.
  const handleSetPrimary = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    
    const loadingToast = toast.loading('Definindo como principal...');

    try {
        // 1. Define TODOS como não principais e NÃO visíveis
        await supabase
            .from('user_payment_methods')
            .update({ is_primary: false, is_visible_in_groups: false })
            .eq('user_id', user.id);

        // 2. Define o ALVO como principal e VISÍVEL
        const { error } = await supabase
            .from('user_payment_methods')
            .update({ is_primary: true, is_visible_in_groups: true })
            .eq('id', id);

        if (error) throw error;

        toast.success("Método principal atualizado!", { id: loadingToast });
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User size={24} className="text-brand-600" />
          Dados Pessoais
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Apelido (Como será visto nos grupos)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ex: Jhonny"
            />
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={24} className="text-brand-600" />
                Métodos de Pagamento
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                Apenas o método marcado com estrela (★) será visível para seus amigos.
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

        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Nenhum método de pagamento cadastrado.
            </p>
          ) : (
            paymentMethods.map(method => {
              const isPix = method.type === 'pix' || method.method_type === 'pix' || !!method.pix_key;
              const isPrimary = method.is_primary;

              return (
              <div 
                key={method.id} 
                onClick={() => handleEdit(method)}
                className={`relative border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all cursor-pointer group hover:shadow-md ${isPrimary ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200 hover:border-brand-300'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${isPrimary ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isPix ? '💠' : '🏦'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${isPrimary ? 'text-brand-900' : 'text-gray-900'}`}>
                          {method.display_text}
                      </p>
                      {isPrimary && (
                        <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            Principal
                        </span>
                      )}
                    </div>
                    {!isPix && (
                        <p className="text-sm text-gray-500 mt-1">
                           {method.bank_name || method.banks?.name} • Ag: {method.agency}
                        </p>
                    )}
                    {isPix && (
                        <p className="text-sm text-gray-500 font-mono mt-1">
                           Chave: {method.pix_key || method.pix_key_masked}
                        </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 w-full md:w-auto justify-end">
                   <button 
                      onClick={(e) => handleSetPrimary(e, method.id)}
                      disabled={isPrimary}
                      className={`p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium ${
                          isPrimary 
                          ? 'text-brand-600 bg-brand-100 cursor-default' 
                          : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={isPrimary ? "Método Principal (Visível)" : "Definir como Principal"}
                   >
                      <Star size={20} fill={isPrimary ? "currentColor" : "none"} />
                   </button>
                   
                   <div className="h-6 w-px bg-gray-200 mx-1"></div>

                   <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(method); }}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-colors"
                      title="Editar"
                   >
                      <Pencil size={18} />
                   </button>

                   <button 
                      onClick={(e) => handleDeleteMethod(e, method.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
              </div>
            )})
          )}
        </div>
      </div>
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
