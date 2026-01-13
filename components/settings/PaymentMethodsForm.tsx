
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PaymentMethod } from '../../types';
import { CreditCard, Plus, Trash2, Banknote, QrCode, Copy, Pencil } from 'lucide-react';
import { POPULAR_BANKS } from '../../lib/constants';
import toast from 'react-hot-toast';

export default function PaymentMethodsForm() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [type, setType] = useState<'pix' | 'bank_account'>('pix');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf'); // cpf, email, phone, random
  
  const [bankCode, setBankCode] = useState('260'); // Nubank default
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountDigit, setAccountDigit] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderDoc, setHolderDoc] = useState('');

  useEffect(() => {
    if (user) fetchMethods();
  }, [user]);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este método de pagamento?')) return;
    try {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
      toast.success('Removido com sucesso.');
      setMethods(methods.filter(m => m.id !== id));
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setType(method.type);
    
    if (method.type === 'pix') {
      setPixKey(method.pix_key || '');
      setPixKeyType(method.pix_key_type || 'cpf');
    } else {
      setBankCode(method.bank_id || '260');
      setAgency(method.agency || '');
      setAccountNumber(method.account_number || '');
      setAccountDigit(method.account_digit || '');
      setHolderName(method.account_holder_name || '');
      setHolderDoc(method.account_holder_document || '');
    }
    
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      // 1. Ensure profile exists
      const { data: profile } = await supabase.from('userprofiles').select('id').eq('id', user.id).maybeSingle();
      
      if (!profile) {
         const { error: createProfileError } = await supabase.from('userprofiles').insert({
             id: user.id,
             email: user.email,
             fullname: user.user_metadata?.full_name || '',
             displayname: user.user_metadata?.full_name || user.email?.split('@')[0],
             updatedat: new Date().toISOString()
         });
         
         if (createProfileError) throw new Error('Erro de consistência de usuário.');
      }

      const payload: any = {
        user_id: user.id,
        type,
        is_active: true,
        is_primary: methods.length === 0 
      };

      if (type === 'pix') {
        if (!pixKey) throw new Error('Chave Pix é obrigatória');
        payload.pix_key = pixKey;
        payload.pix_key_type = pixKeyType;
        // Limpar campos de banco caso esteja trocando de tipo
        payload.bank_id = null;
        payload.agency = null;
        payload.account_number = null;
        payload.account_digit = null;
        payload.account_holder_name = null;
        payload.account_holder_document = null;
      } else {
        if (!agency || !accountNumber || !accountDigit || !holderName || !holderDoc) {
            throw new Error('Preencha todos os dados bancários');
        }
        payload.bank_id = bankCode; 
        payload.agency = agency;
        payload.account_number = accountNumber;
        payload.account_digit = accountDigit;
        payload.account_holder_name = holderName;
        payload.account_holder_document = holderDoc;
        // Limpar campos pix
        payload.pix_key = null;
        payload.pix_key_type = null;
      }

      if (editingId) {
        // Update existing
        const { data, error } = await supabase
          .from('payment_methods')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId)
          .select()
          .single();
        
        if (error) throw error;
        setMethods(methods.map(m => m.id === editingId ? data : m));
        toast.success('Método atualizado!');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('payment_methods')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        setMethods([...methods, data]);
        toast.success('Método adicionado!');
      }

      setIsModalOpen(false);
      resetForm();
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setType('pix');
    setPixKey('');
    setPixKeyType('cpf');
    setBankCode('260');
    setAgency('');
    setAccountNumber('');
    setAccountDigit('');
    setHolderName('');
    setHolderDoc('');
  };

  const getBankName = (code?: string) => {
    return POPULAR_BANKS.find(b => b.code === code)?.name || 'Banco';
  };

  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard size={24} className="text-brand-600" />
          Métodos de Pagamento
        </h2>
        <Button size="sm" onClick={openAddModal}>
          <Plus size={16} className="mr-1" /> Adicionar
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-sm">Carregando...</p>
        ) : methods.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-dark-800 rounded-lg border border-dashed border-gray-300 dark:border-dark-600">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum método cadastrado.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Adicione sua Chave Pix ou conta para facilitar o recebimento.</p>
          </div>
        ) : (
          methods.map(method => (
            <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-dark-700 flex items-center justify-center shadow-sm">
                  {method.type === 'pix' ? <QrCode size={20} className="text-brand-500" /> : <Banknote size={20} className="text-green-500" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {method.type === 'pix' ? 'Chave Pix' : getBankName(method.bank_id)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {method.type === 'pix' 
                      ? method.pix_key 
                      : `Ag ${method.agency} Cc ${method.account_number}-${method.account_digit}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(method)} 
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(method.id)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Método" : "Adicionar Método"}>
        <form onSubmit={handleSaveMethod} className="space-y-4">
          <div className="flex p-1 bg-gray-100 dark:bg-dark-700 rounded-lg mb-4">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'pix' ? 'bg-white dark:bg-dark-600 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setType('pix')}
            >
              Pix
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'bank_account' ? 'bg-white dark:bg-dark-600 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setType('bank_account')}
            >
              Conta Bancária
            </button>
          </div>

          {type === 'pix' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo de Chave</label>
                <select 
                  className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-gray-900 dark:text-white"
                  value={pixKeyType}
                  onChange={e => setPixKeyType(e.target.value)}
                >
                  <option value="cpf">CPF/CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Celular</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <Input 
                label="Chave Pix" 
                placeholder={pixKeyType === 'email' ? 'exemplo@pix.com' : 'Informe a chave'} 
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                required
              />
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Banco</label>
                <select 
                  className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-gray-900 dark:text-white"
                  value={bankCode}
                  onChange={e => setBankCode(e.target.value)}
                >
                  {POPULAR_BANKS.map(bank => (
                    <option key={bank.code} value={bank.code}>{bank.short} - {bank.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Agência" placeholder="0000" value={agency} onChange={e => setAgency(e.target.value)} required />
                <Input label="Conta" placeholder="000000" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required />
                <Input label="Dígito" placeholder="0" value={accountDigit} onChange={e => setAccountDigit(e.target.value)} required />
              </div>
              <Input label="Nome do Titular" placeholder="Nome Completo" value={holderName} onChange={e => setHolderName(e.target.value)} required />
              <Input label="CPF/CNPJ do Titular" placeholder="000.000.000-00" value={holderDoc} onChange={e => setHolderDoc(e.target.value)} required />
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={saving}>
                {editingId ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
