
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense, ExpenseSplit } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ExpenseCharts } from '../../components/Charts';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import InviteModal from '../../components/invite/InviteModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, UserPlus, Receipt, PieChart, Users, Pencil, Trash2, Check, AlertCircle, Lock } from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

type SplitMode = 'equal' | 'amount' | 'percentage';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  // Data State
  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [members, setMembers] = useState<DivvyMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'expenses' | 'charts' | 'members'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  
  // Split State
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [splitValues, setSplitValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id && user) {
      fetchDivvyData();
    }
  }, [id, user]);

  const fetchDivvyData = async () => {
    try {
      const { data: divvyData } = await supabase.from('divvies').select('*').eq('id', id).single();
      setDivvy(divvyData);

      // 1. Fetch Divvy Members
      const { data: memberData } = await supabase
        .from('divvy_members')
        .select('*')
        .eq('divvy_id', id);
        
      if (memberData && memberData.length > 0) {
        // 2. Fetch Profiles separately
        const userIds = memberData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        const mergedMembers = memberData.map(member => {
            const profile = profilesData?.find(p => p.id === member.user_id);
            return {
                ...member,
                profiles: profile || null 
            };
        });
        setMembers(mergedMembers);
      } else {
        setMembers([]);
      }

      const { data: expenseData } = await supabase.from('expenses').select('*').eq('divvy_id', id).order('date', { ascending: false });
      setExpenses(expenseData || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para obter nome de exibição (Apelido > Nome > Email)
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    if (!member) return 'Desconhecido';
    
    const isMe = userId === user?.id;
    const profile = member.profiles;
    let displayName = member.email;

    if (profile) {
       displayName = profile.nickname || profile.full_name || profile.email || 'Membro';
    }

    if (displayName && displayName.includes('@')) {
        displayName = displayName.split('@')[0];
    }
    
    return isMe ? `${displayName} (Você)` : displayName;
  };

  // --- Handlers for Modal Opening ---

  const handleOpenAddExpense = () => {
    if (!user) return;
    if (divvy?.is_archived) {
       toast.error("Grupo arquivado. Não é possível adicionar despesas.");
       return;
    }
    setEditingExpenseId(null);
    setAmount('');
    setCategory('food');
    setDesc('');
    setDate(new Date().toISOString().split('T')[0]);
    setPayerId(user.id);
    setSplitMode('equal');
    
    const initialSplits: Record<string, number> = {};
    members.forEach(m => initialSplits[m.user_id] = 1);
    setSplitValues(initialSplits);

    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = async (exp: Expense) => {
    if (divvy?.is_archived) return;

    setEditingExpenseId(exp.id);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDesc(exp.description);
    setDate(exp.date);
    setPayerId(exp.paid_by_user_id);

    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('*')
      .eq('expense_id', exp.id);
    
    const splits = splitsData as ExpenseSplit[] | null;

    if (splits && splits.length > 0) {
      const loadedSplits: Record<string, number> = {};
      const firstAmount = splits[0].amount_owed;
      const isRoughlyEqual = splits.every(s => Math.abs(s.amount_owed - firstAmount) < 0.02);
      
      if (isRoughlyEqual) {
        setSplitMode('equal');
        members.forEach(m => loadedSplits[m.user_id] = 0);
        splits.forEach(s => loadedSplits[s.participant_user_id] = 1);
      } else {
        setSplitMode('amount');
        members.forEach(m => loadedSplits[m.user_id] = 0);
        splits.forEach(s => loadedSplits[s.participant_user_id] = s.amount_owed);
      }
      setSplitValues(loadedSplits);
    } else {
        setSplitMode('equal');
        const initialSplits: Record<string, number> = {};
        members.forEach(m => initialSplits[m.user_id] = 1);
        setSplitValues(initialSplits);
    }

    setIsExpenseModalOpen(true);
  };

  const totalAmount = parseFloat(amount) || 0;

  const getSplitSummary = () => {
    let currentTotal = 0;
    let isValid = true;
    let message = '';

    if (splitMode === 'equal') {
      const selectedCount = Object.values(splitValues).filter(v => v === 1).length;
      if (selectedCount === 0) {
        isValid = false;
        message = 'Selecione pelo menos uma pessoa.';
      } else {
        const perPerson = totalAmount / selectedCount;
        message = `R$ ${perPerson.toFixed(2)} por pessoa`;
      }
    } 
    else if (splitMode === 'amount') {
      currentTotal = (Object.values(splitValues) as number[]).reduce((a, b) => a + b, 0);
      const diff = totalAmount - currentTotal;
      if (Math.abs(diff) > 0.02) {
        isValid = false;
        if (diff > 0) message = `Faltam R$ ${diff.toFixed(2)}`;
        else message = `Passou R$ ${Math.abs(diff).toFixed(2)}`;
      } else {
        message = 'Total correto ✅';
      }
    } 
    else if (splitMode === 'percentage') {
      currentTotal = (Object.values(splitValues) as number[]).reduce((a, b) => a + b, 0);
      const diff = 100 - currentTotal;
      if (Math.abs(diff) > 0.1) {
        isValid = false;
        if (diff > 0) message = `Faltam ${diff.toFixed(1)}%`;
        else message = `Passou ${Math.abs(diff).toFixed(1)}%`;
      } else {
        message = 'Total 100% ✅';
      }
    }

    return { isValid, message };
  };

  const { isValid: isSplitValid, message: splitMessage } = getSplitSummary();

  const handleSplitChange = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSplitValues(prev => ({
      ...prev,
      [userId]: numValue
    }));
  };

  const handleToggleMember = (userId: string) => {
    setSplitValues(prev => ({
      ...prev,
      [userId]: prev[userId] === 1 ? 0 : 1
    }));
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !divvy || !isSplitValid) return;
    setSubmitLoading(true);

    try {
      let expenseId = editingExpenseId;

      const expenseData = {
        divvy_id: divvy.id,
        paid_by_user_id: payerId,
        amount: totalAmount,
        category,
        description: desc,
        date: date,
        updated_at: new Date().toISOString()
      };

      if (editingExpenseId) {
        const { error } = await supabase.from('expenses').update(expenseData).eq('id', editingExpenseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('expenses').insert(expenseData).select().single();
        if (error) throw error;
        expenseId = data.id;
      }

      if (expenseId) {
        await supabase.from('expense_splits').delete().eq('expense_id', expenseId);

        let splitsToInsert: any[] = [];

        if (splitMode === 'equal') {
          const selectedMembers = members.filter(m => splitValues[m.user_id] === 1);
          const splitAmount = totalAmount / selectedMembers.length;
          splitsToInsert = selectedMembers.map(m => ({
            expense_id: expenseId,
            participant_user_id: m.user_id,
            amount_owed: splitAmount
          }));
        } else if (splitMode === 'amount') {
           splitsToInsert = members
            .filter(m => splitValues[m.user_id] > 0)
            .map(m => ({
              expense_id: expenseId,
              participant_user_id: m.user_id,
              amount_owed: splitValues[m.user_id]
            }));
        } else if (splitMode === 'percentage') {
           splitsToInsert = members
            .filter(m => splitValues[m.user_id] > 0)
            .map(m => ({
              expense_id: expenseId,
              participant_user_id: m.user_id,
              amount_owed: totalAmount * (splitValues[m.user_id] / 100)
            }));
        }

        if (splitsToInsert.length > 0) {
          const { error: splitError } = await supabase.from('expense_splits').insert(splitsToInsert);
          if (splitError) throw splitError;
        }
      }

      toast.success(editingExpenseId ? 'Despesa atualizada!' : 'Despesa adicionada!');
      setIsExpenseModalOpen(false);
      fetchDivvyData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error('Erro ao salvar despesa: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (divvy?.is_archived) return;
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
      toast.success('Despesa excluída');
      fetchDivvyData();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (!divvy) return <div className="text-center p-12">Divvy não encontrado</div>;

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy} onUpdate={fetchDivvyData} />

      {divvy.is_archived && (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 p-4 rounded-lg flex items-center gap-3">
          <Lock size={20} />
          <div>
            <p className="font-bold">Este grupo está arquivado.</p>
            <p className="text-sm">Não é possível adicionar ou editar despesas, mas você pode visualizar o histórico.</p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Convidar
        </Button>
        <Button 
           onClick={handleOpenAddExpense} 
           disabled={divvy.is_archived}
           className={divvy.is_archived ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Plus size={18} className="mr-2" />
          Nova Despesa
        </Button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'expenses' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Receipt size={16} /> Despesas
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'charts' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PieChart size={16} /> Análise
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'members' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} /> Membros ({members.length})
          </button>
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? <EmptyState /> : expenses.map((exp) => {
              const canEdit = (user?.id === exp.paid_by_user_id || user?.id === divvy.creator_id) && !divvy.is_archived;
              
              return (
                <div key={exp.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${divvy.is_archived ? 'opacity-75' : ''}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                      {exp.category === 'food' ? '🍽️' : 
                       exp.category === 'transport' ? '🚗' : 
                       exp.category === 'accommodation' ? '🏨' : 
                       exp.category === 'activity' ? '🎬' : '💰'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{exp.description || exp.category}</p>
                      <div className="text-sm text-gray-500 flex gap-2">
                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Pago por <strong>{getMemberName(exp.paid_by_user_id)}</strong></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right mr-2">
                      <p className="font-bold text-gray-900">R$ {exp.amount.toFixed(2)}</p>
                    </div>
                    
                    {canEdit && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100">
             <ExpenseCharts expenses={expenses} />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(member => {
              const avatar = member.profiles?.avatar_url;
              const name = getMemberName(member.user_id);
              
              return (
                <div key={member.id} className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3">
                  {avatar ? (
                     <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{member.role === 'admin' ? '👑 Admin' : 'Membro'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title={editingExpenseId ? "Editar Despesa" : "Nova Despesa"}
        size="lg"
      >
        <form onSubmit={handleSaveExpense} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
               label="Valor Total (R$)"
               type="number"
               step="0.01"
               value={amount}
               onChange={(e: any) => setAmount(e.target.value)}
               required
               placeholder="0,00"
               className="text-lg font-bold"
            />
            
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e: any) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
              label="Descrição"
              value={desc}
              onChange={(e: any) => setDesc(e.target.value)}
              placeholder="Ex: Jantar no Outback"
              required
            />
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="food">🍽️ Alimentação</option>
                <option value="transport">🚗 Transporte</option>
                <option value="accommodation">🏨 Hospedagem</option>
                <option value="activity">🎬 Lazer</option>
                <option value="utilities">💡 Contas</option>
                <option value="shopping">🛍️ Compras</option>
                <option value="other">💰 Outro</option>
              </select>
            </div>
          </div>

          {/* Quem pagou? - Aqui garantimos o uso do apelido/nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quem pagou?</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
            >
              {members.map(m => (
                <option key={m.id} value={m.user_id}>
                  {getMemberName(m.user_id)}
                </option>
              ))}
            </select>
          </div>

          {/* Divisão */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Como dividir?</label>
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${splitMode === 'equal' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Igualmente
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('amount')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${splitMode === 'amount' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Valores (R$)
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('percentage')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${splitMode === 'percentage' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Porcentagem (%)
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {members.map(m => {
                const name = getMemberName(m.user_id);
                const avatar = m.profiles?.avatar_url;

                return (
                  <div key={m.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 truncate">{name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {splitMode === 'equal' && (
                         <button
                           type="button"
                           onClick={() => handleToggleMember(m.user_id)}
                           className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${splitValues[m.user_id] === 1 ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 text-transparent'}`}
                         >
                           <Check size={14} />
                         </button>
                      )}

                      {splitMode === 'amount' && (
                         <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={splitValues[m.user_id] || ''}
                              onChange={(e) => handleSplitChange(m.user_id, e.target.value)}
                              className="w-full pl-6 pr-2 py-1 text-right text-sm border border-gray-300 rounded focus:border-brand-500 focus:outline-none"
                              placeholder="0.00"
                            />
                         </div>
                      )}

                      {splitMode === 'percentage' && (
                         <div className="relative w-20">
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={splitValues[m.user_id] || ''}
                              onChange={(e) => handleSplitChange(m.user_id, e.target.value)}
                              className="w-full pl-2 pr-6 py-1 text-right text-sm border border-gray-300 rounded focus:border-brand-500 focus:outline-none"
                              placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${isSplitValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
               {isSplitValid ? <Check size={16} /> : <AlertCircle size={16} />}
               <span className="font-medium">{splitMessage}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
             <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
             <Button type="submit" isLoading={submitLoading} disabled={!isSplitValid}>
               {editingExpenseId ? 'Salvar Alterações' : 'Criar Despesa'}
             </Button>
          </div>
        </form>
      </Modal>

      <InviteModal 
        divvyId={divvy.id}
        divvyName={divvy.name}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default function DivvyDetail() {
  return (
    <ProtectedRoute>
      <DivvyDetailContent />
    </ProtectedRoute>
  );
}
