
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense, ExpenseSplit, PaymentMethod } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ExpenseCharts } from '../../components/Charts';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import InviteModal from '../../components/invite/InviteModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, UserPlus, Receipt, PieChart, Users, Pencil, Trash2, CreditCard, Lock } from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

type SplitMode = 'equal' | 'amount' | 'percentage';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  // Ensure id is a string
  const divvyId = typeof id === 'string' ? id : '';
  
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

  // Payment View State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewingMemberName, setViewingMemberName] = useState('');
  const [memberPaymentMethods, setMemberPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Advanced Split Logic State
  const [payerId, setPayerId] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  // Usamos string para permitir edição fluida de inputs (ex: "10.") sem forçar parse imediato
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (divvyId && user) {
      fetchDivvyData();
    }
  }, [divvyId, user]);

  const fetchDivvyData = async () => {
    try {
      const { data: divvyData } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
      setDivvy(divvyData);

      const { data: memberData } = await supabase
        .from('divvy_members')
        .select('*')
        .eq('divvy_id', divvyId);
        
      if (memberData && memberData.length > 0) {
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

      const { data: expenseData } = await supabase.from('expenses').select('*').eq('divvy_id', divvyId).order('date', { ascending: false });
      setExpenses(expenseData || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
    setPayerId(user.id); // Default to current user
    
    // Initialize split: Equal split, everyone selected ("1" = selected)
    setSplitMode('equal');
    const initialSplits: Record<string, string> = {};
    members.forEach(m => initialSplits[m.user_id] = "1");
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

    // Fetch existing splits to populate form
    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('*')
      .eq('expense_id', exp.id);
    
    const splits = splitsData as ExpenseSplit[] | null;

    if (splits && splits.length > 0) {
      const loadedSplits: Record<string, string> = {};
      const firstAmount = splits[0].amount_owed;
      
      // Heuristic: Check if all splits are roughly equal
      const isRoughlyEqual = splits.every(s => Math.abs(s.amount_owed - firstAmount) < 0.05);
      
      if (isRoughlyEqual) {
        setSplitMode('equal');
        // Reset all to "0" (unselected) first
        members.forEach(m => loadedSplits[m.user_id] = "0");
        // Set participants to "1" (selected)
        splits.forEach(s => loadedSplits[s.participant_user_id] = "1");
      } else {
        setSplitMode('amount');
        members.forEach(m => loadedSplits[m.user_id] = "0");
        splits.forEach(s => loadedSplits[s.participant_user_id] = String(s.amount_owed));
      }
      setSplitValues(loadedSplits);
    } else {
        // Fallback
        setSplitMode('equal');
        const initialSplits: Record<string, string> = {};
        members.forEach(m => initialSplits[m.user_id] = "1");
        setSplitValues(initialSplits);
    }

    setIsExpenseModalOpen(true);
  };

  // Validation Logic
  const totalAmount = parseFloat(amount) || 0;
  
  const getSplitSummary = () => {
      if (totalAmount <= 0) return { isValid: false, message: 'Insira um valor válido' };

      // Parse string values to numbers for calculation
      const numericValues = Object.entries(splitValues).reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val) || 0;
          return acc;
      }, {} as Record<string, number>);

      if (splitMode === 'equal') {
          const selectedCount = Object.values(numericValues).filter(v => v === 1).length;
          if (selectedCount === 0) return { isValid: false, message: 'Selecione pelo menos uma pessoa' };
          const perPerson = totalAmount / selectedCount;
          return { isValid: true, message: `R$ ${perPerson.toFixed(2)} por pessoa` };
      } 
      
      const currentSum = Object.values(numericValues).reduce((a, b) => a + b, 0);
      
      if (splitMode === 'amount') {
          const diff = totalAmount - currentSum;
          const isValid = Math.abs(diff) < 0.05; // Tolerance for floating point
          if (isValid) return { isValid: true, message: 'Total fechado corretamente' };
          return { isValid: false, message: diff > 0 ? `Faltam R$ ${Math.abs(diff).toFixed(2)}` : `Passou R$ ${Math.abs(diff).toFixed(2)}` };
      }

      if (splitMode === 'percentage') {
          const diff = 100 - currentSum;
          const isValid = Math.abs(diff) < 0.1;
          if (isValid) return { isValid: true, message: 'Total: 100%' };
          return { isValid: false, message: diff > 0 ? `Faltam ${Math.abs(diff).toFixed(1)}%` : `Passou ${Math.abs(diff).toFixed(1)}%` };
      }

      return { isValid: false, message: '' };
  };

  const { isValid: isSplitValid, message: splitMessage } = getSplitSummary();

  const handleSplitValueChange = (userId: string, value: string) => {
    // Permite digitação livre (inclusive "0." ou vazio)
    setSplitValues(prev => ({ ...prev, [userId]: value }));
  };

  const toggleMemberSelection = (userId: string) => {
    setSplitValues(prev => ({ ...prev, [userId]: prev[userId] === "1" ? "0" : "1" }));
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
        await supabase.from('expenses').update(expenseData).eq('id', editingExpenseId);
      } else {
        const { data } = await supabase.from('expenses').insert(expenseData).select().single();
        if (data) expenseId = (data as Expense).id;
      }

      if (expenseId) {
        // Delete old splits
        await supabase.from('expense_splits').delete().eq('expense_id', expenseId);
        
        // Calculate new splits
        let splitsToInsert: any[] = [];
        
        // Parse current values
        const numericValues = Object.entries(splitValues).reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val) || 0;
          return acc;
        }, {} as Record<string, number>);

        if (splitMode === 'equal') {
          const selectedMembers = members.filter(m => numericValues[m.user_id] === 1);
          const amountPerPerson = totalAmount / selectedMembers.length;
          splitsToInsert = selectedMembers.map(m => ({
            expense_id: expenseId,
            participant_user_id: m.user_id,
            amount_owed: amountPerPerson
          }));
        } else if (splitMode === 'amount') {
          splitsToInsert = members
            .filter(m => numericValues[m.user_id] > 0)
            .map(m => ({
              expense_id: expenseId,
              participant_user_id: m.user_id,
              amount_owed: numericValues[m.user_id]
            }));
        } else if (splitMode === 'percentage') {
           splitsToInsert = members
            .filter(m => numericValues[m.user_id] > 0)
            .map(m => ({
              expense_id: expenseId,
              participant_user_id: m.user_id,
              amount_owed: totalAmount * (numericValues[m.user_id] / 100)
            }));
        }

        if (splitsToInsert.length > 0) {
           await supabase.from('expense_splits').insert(splitsToInsert);
        }
      }

      toast.success(editingExpenseId ? 'Despesa atualizada!' : 'Despesa adicionada!');
      setIsExpenseModalOpen(false);
      fetchDivvyData();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error('Erro ao salvar despesa: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
      if (!confirm('Excluir despesa?')) return;
      await supabase.from('expenses').delete().eq('id', expenseId);
      fetchDivvyData();
  };

  const handleOpenPaymentInfo = async (memberId: string) => {
    setLoadingPayments(true);
    setViewingMemberName(getMemberName(memberId).replace(' (Você)', ''));
    setIsPaymentModalOpen(true);
    setMemberPaymentMethods([]);

    try {
        const { data, error } = await supabase.rpc('get_divvy_members_payment_methods', {
            p_divvy_id: divvyId
        });

        if (error) throw error;
        const memberMethods = (data || []).filter((m: any) => m.member_id === memberId);
        setMemberPaymentMethods(memberMethods);
    } catch (error: any) {
        console.error("Error fetching payment info:", error);
        toast.error("Erro ao carregar dados de pagamento.");
    } finally {
        setLoadingPayments(false);
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
            {expenses.length === 0 ? <EmptyState /> : expenses.map((exp) => (
               <div key={exp.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl">
                      {exp.category === 'food' ? '🍽️' : 
                       exp.category === 'transport' ? '🚗' : 
                       exp.category === 'accommodation' ? '🏨' : 
                       exp.category === 'activity' ? '🎬' : 
                       exp.category === 'utilities' ? '💡' :
                       exp.category === 'shopping' ? '🛍️' : '💰'}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{exp.description || exp.category}</p>
                        <p className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()} • {getMemberName(exp.paid_by_user_id)}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="font-bold">R$ {exp.amount.toFixed(2)}</span>
                    {!divvy.is_archived && (
                        <div className="flex gap-1">
                           <button onClick={() => handleOpenEditExpense(exp)} className="p-2 hover:bg-gray-100 rounded-full"><Pencil size={16} /></button>
                           <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-full"><Trash2 size={16} /></button>
                        </div>
                    )}
                 </div>
               </div>
            ))}
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
                <div key={member.id} className="bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                       <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  
                  <button 
                     onClick={() => handleOpenPaymentInfo(member.user_id)}
                     className="text-brand-600 hover:bg-brand-50 p-2 rounded-full transition-colors"
                     title="Ver dados de pagamento"
                  >
                     <CreditCard size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD/EDIT EXPENSE MODAL */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title={editingExpenseId ? "Editar Despesa" : "Nova Despesa"}>
         <form onSubmit={handleSaveExpense} className="space-y-5">
           
           {/* General Info */}
           <div className="space-y-3">
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="text-lg font-bold"
              />
              
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="food">🍽️ Alimentação</option>
                      <option value="transport">🚗 Transporte</option>
                      <option value="accommodation">🏨 Hospedagem</option>
                      <option value="activity">🎬 Atividade</option>
                      <option value="utilities">💡 Contas</option>
                      <option value="shopping">🛍️ Compras</option>
                      <option value="other">💰 Outros</option>
                    </select>
                  </div>
                  <Input
                    label="Data"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
              </div>

              <Input
                label="Descrição"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ex: Jantar no centro"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quem pagou?</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {getMemberName(m.user_id)}
                    </option>
                  ))}
                </select>
              </div>
           </div>

           <hr className="border-gray-200" />

           {/* Split Section */}
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Divisão</label>
              
              {/* Split Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${splitMode === 'equal' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Igual
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('amount')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${splitMode === 'amount' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Valor (R$)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('percentage')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${splitMode === 'percentage' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  %
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {members.map(m => {
                  const name = getMemberName(m.user_id);
                  const isSelected = splitValues[m.user_id] === "1";
                  
                  return (
                    <div key={m.user_id} className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {splitMode === 'equal' && (
                           <input 
                              type="checkbox" 
                              checked={isSelected} 
                              onChange={() => toggleMemberSelection(m.user_id)}
                              className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                           />
                        )}
                        <span className={`text-sm truncate ${splitMode === 'equal' && !isSelected ? 'text-gray-400' : 'text-gray-700'}`}>
                           {name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {splitMode === 'equal' ? (
                           isSelected ? (
                             <span className="text-sm font-medium text-gray-900">
                               R$ {((totalAmount / Math.max(1, Object.values(splitValues).filter(v => v === "1").length))).toFixed(2)}
                             </span>
                           ) : <span className="text-xs text-gray-400">-</span>
                        ) : (
                           <div className="relative">
                              <span className="absolute left-2 top-1.5 text-xs text-gray-400">
                                {splitMode === 'amount' ? 'R$' : '%'}
                              </span>
                              <input
                                type="number"
                                step={splitMode === 'amount' ? "0.01" : "1"}
                                value={splitValues[m.user_id] || ''}
                                onChange={(e) => handleSplitValueChange(m.user_id, e.target.value)}
                                className="w-24 pl-6 pr-2 py-1 text-right text-sm border rounded focus:ring-1 focus:ring-brand-500 outline-none"
                                placeholder="0"
                              />
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Validation Feedback */}
              <div className={`mt-2 text-sm text-right font-medium ${isSplitValid ? 'text-green-600' : 'text-red-500'}`}>
                 {splitMessage}
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-2">
             <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
             <Button type="submit" isLoading={submitLoading} disabled={!isSplitValid}>Salvar</Button>
           </div>
         </form>
      </Modal>

      {/* PAYMENT INFO MODAL */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Pagamento - ${viewingMemberName}`}>
         <div className="space-y-4">
            {loadingPayments ? (
               <LoadingSpinner />
            ) : memberPaymentMethods.length === 0 ? (
               <p className="text-gray-500 text-center py-4">Nenhum método de pagamento disponível.</p>
            ) : (
               memberPaymentMethods.map(method => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                     <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{method.method_type === 'pix' ? '💠' : '🏦'}</span>
                        <h4 className="font-bold text-gray-900">{method.display_text}</h4>
                     </div>
                     <div className="space-y-1 text-sm text-gray-600 pl-10">
                        {method.method_type === 'pix' ? (
                           <p className="font-mono bg-white p-2 rounded border border-gray-200 select-all">
                              {method.pix_key_masked || method.pix_key}
                           </p>
                        ) : (
                           <>
                              <p>Agência: {method.agency_masked}</p>
                              <p>Conta: {method.account_number_masked}</p>
                              <p>Titular: {method.account_holder_name}</p>
                           </>
                        )}
                     </div>
                  </div>
               ))
            )}
            <Button variant="outline" fullWidth onClick={() => setIsPaymentModalOpen(false)}>Fechar</Button>
         </div>
      </Modal>

      <InviteModal divvyId={divvy.id} divvyName={divvy.name} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
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
