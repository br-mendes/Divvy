
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProtectedRoute } from '../components/ProtectedRoute';
import toast from 'react-hot-toast';
import { User, Upload, Check, CreditCard, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
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
  const [isAddingPayment, setIsAddingPayment] = useState(false);
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
      setName(user.user_metadata?.full_name || '');
      setNickname(user.user_metadata?.nickname || '');
      setEmail(user.email || '');
      
      fetchPaymentData();
    }
  }, [user]);

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
    setProfileLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          nickname: nickname,
        }
      });

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPaymentLoading(true);

    try {
      const payload: any = {
        user_id: user.id,
        type: methodType,
        is_primary: paymentMethods.length === 0, // First one is primary
      };

      if (methodType === 'pix') {
        if (!pixKey) throw new Error("Chave PIX é obrigatória");
        payload.pix_key = pixKey;
        payload.pix_key_type = pixKeyType;
      } else {
        payload.bank_id = selectedBankId || null;
        payload.agency = agency;
        payload.account_number = accountNumber;
        payload.account_digit = accountDigit;
        payload.account_type = accountType;
        payload.account_holder_name = holderName || name;
        payload.account_holder_document = holderDoc;
      }

      const { error } = await supabase.from('user_payment_methods').insert(payload);
      if (error) throw error;

      toast.success('Método de pagamento adicionado!');
      setIsAddingPayment(false);
      resetPaymentForm();
      fetchPaymentData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este método de pagamento?")) return;
    try {
      // Tenta usar RPC segura primeiro
      const { error } = await supabase.rpc('delete_payment_method', {
          p_payment_method_id: id
      });

      if (error) {
          // Se RPC falhar (ex: não existe), tenta método direto
          console.warn("RPC delete failed, trying direct update", error);
          const { error: updateError } = await supabase
            .from('user_payment_methods')
            .update({ is_active: false })
            .eq('id', id);
            
          if (updateError) throw updateError;
      }
      
      fetchPaymentData();
      toast.success("Método removido");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
        // Tenta usar RPC segura primeiro
        const { error } = await supabase.rpc('toggle_payment_method_visibility', {
            p_payment_method_id: id,
            p_is_visible: !current
        });

        if (error) {
             console.warn("RPC toggle failed, trying direct update", error);
             const { error: updateError } = await supabase
                .from('user_payment_methods')
                .update({ is_visible_in_groups: !current })
                .eq('id', id);
             if (updateError) throw updateError;
        }

        fetchPaymentData();
    } catch (error: any) {
        toast.error("Erro ao alterar visibilidade: " + error.message);
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
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={24} className="text-brand-600" />
            Métodos de Pagamento
          </h2>
          {!isAddingPayment && (
            <Button onClick={() => setIsAddingPayment(true)} variant="outline" size="sm">
              <Plus size={16} className="mr-2" />
              Adicionar
            </Button>
          )}
        </div>

        {isAddingPayment && (
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 animate-fade-in-down">
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

            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              {methodType === 'pix' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chave</label>
                      <select
                        value={pixKeyType}
                        onChange={(e) => setPixKeyType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco</