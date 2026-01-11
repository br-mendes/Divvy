
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
import { Plus, UserPlus, Receipt, PieChart, Users, Pencil, Trash2, CreditCard, Lock, Copy, QrCode, Check, Eye, Wallet, ArrowRight } from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

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
  const [allSplits, setAllSplits] = useState<ExpenseSplit[]>([]); // New state for global calculation
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'charts' | 'members'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // View Expense State (Read Only)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [viewingSplits, setViewingSplits] = useState<ExpenseSplit[]>([]);
  const [loadingView, setLoadingView] = useState(false);

  // Payment View State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewingMemberName, setViewingMemberName] = useState('');
  const [memberPaymentMethods, setMemberPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // Pix QR Code & Copy State
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);
  const [activeQrMethodId, setActiveQrMethodId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Advanced Split Logic State
  const [payerId, setPayerId] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
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

      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .eq('divvy_id', divvyId)
        .order('date', { ascending: false });
      
      setExpenses(expenseData || []);

      // Fetch ALL splits for balance calculation
      if (expenseData && expenseData.length > 0) {
        const expenseIds = expenseData.map(e => e.id);
        const { data: splitsData } = await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds);
        setAllSplits(splitsData || []);
      } else {
        setAllSplits([]);
      }

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
    let displayName = '';

    // Priority: Nickname > Full Name > Email
    if (profile?.nickname && profile.nickname.trim() !== '') {
      displayName = profile.nickname;
    } else if (profile?.full_name && profile.full_name.trim() !== '') {
      displayName = profile.full_name;
    } else if (member.email) {
      displayName = member.email.split('@')[0];
    } else {
      displayName = 'Membro';
    }
    
    return isMe ? `${displayName} (Você)` : displayName;
  };

  // --- BALANCE CALCULATION LOGIC ---
  const calculateBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    const totalPaid: Record<string, number> = {};
    const totalConsumed: Record<string, number> = {};

    // Initialize
    members.forEach(m => {
        balances[m.user_id] = 0;
        totalPaid[m.user_id] = 0;
        totalConsumed[m.user_id] = 0;
    });

    // 1. Add up what users PAID
    expenses.forEach(exp => {
        const amount = exp.amount;
        if (totalPaid[exp.paid_by_user_id] !== undefined) {
            totalPaid[exp.paid_by_user_id] += amount;
            balances[exp.paid_by_user_id] += amount; // They are OWED this amount initially
        }
    });

    // 2. Subtract what users CONSUMED (Splits)
    allSplits.forEach(split => {
        const amount = split.amount_owed;
        if (totalConsumed[split.participant_user_id] !== undefined) {
            totalConsumed[split.participant_user_id] += amount;
            balances[split.participant_user_id] -= amount; // They OWE this amount
        }
    });

    // 3. Calculate Debt Settlement Plan (Minimize Transactions)
    const debtors: { id: string, amount: number }[] = [];
    const creditors: { id: string, amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        // Round to 2 decimals to avoid floating point issues
        const rounded = Math.round(amount * 100) / 100;
        if (rounded < -0.01) debtors.push({ id, amount: rounded });
        if (rounded > 0.01) creditors.push({ id, amount: rounded });
    });

    debtors.sort((a, b) => a.amount - b.amount); // Most negative first
    creditors.sort((a, b) => b.amount - a.amount); // Most positive first

    const plan: { from: string, to: string, amount: number }[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to settle is the minimum of what debtor owes and creditor is owed
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
        
        if (amount > 0.01) {
            plan.push({ from: debtor.id, to: creditor.id, amount });
        }

        // Adjust remaining amounts
        debtor.amount += amount;
        creditor.amount -= amount;

        // Move indices if settled
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return { balances, totalPaid, totalConsumed, plan };
  }, [expenses, allSplits, members]);


  const handleViewExpense = async (exp: Expense) => {
    setViewingExpense(exp);
    setIsViewModalOpen(true);
    setLoadingView(true);
    setViewingSplits([]);

    try {
      const { data } = await supabase
        .from('expense_splits')
        .select('*')
        .eq('expense_id', exp.id);
      
      setViewingSplits(data || []);
    } catch (err) {
      console.error("Erro ao carregar divisão", err);
    } finally {
      setLoadingView(false);
    }
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

    // Se estiver vindo do modal de visualização
    setIsViewModalOpen(false);

    setEditingExpenseId(exp.id);
    setAmount(String(exp.amount)); 
    setCategory(exp.category);
    setDesc(exp.description);
    setDate(exp.date);
    setPayerId(exp.paid_by_user_id);

    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('*')
      .eq('expense_id', String(exp.id));
    
    const splits = splitsData as ExpenseSplit[] | null;

    if (splits && splits.length > 0) {
      const loadedSplits: Record<string, string> = {};
      const firstAmount = splits[0].amount_owed;
      const isRoughlyEqual = splits.every(s => Math.abs(s.amount_owed - firstAmount) < 0.05);
      
      if (isRoughlyEqual) {
        setSplitMode('equal');
        members.forEach(m => loadedSplits[m.user_id] = "0");
        splits.forEach(s => loadedSplits[s.participant_user_id] = "1");
      } else {
        setSplitMode('amount');
        members.forEach(m => loadedSplits[m.user_id] = "0");
        splits.forEach(s => loadedSplits[s.participant_user_id] = String(s.amount_owed));
      }
      setSplitValues(loadedSplits);
    } else {
        setSplitMode('equal');
        const initialSplits: Record<string, string> = {};
        members.forEach(m => initialSplits[m.user_id] = "1");
        setSplitValues(initialSplits);
    }

    setIsExpenseModalOpen(true);
  };

  const totalAmount = parseFloat(amount) || 0;
  
  const getSplitSummary = (): { isValid: boolean; message: string } => {
      if (totalAmount <= 0) return { isValid: false, message: 'Insira um valor válido' };

      const numericValues = Object.entries(splitValues).reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val as string) || 0;
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
          const isValid = Math.abs(diff) < 0.05; 
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
        if (data) expenseId = (data as any).id;
      }

      if (expenseId) {
        await supabase.from('expense_splits').delete().eq('expense_id', expenseId);
        
        let splitsToInsert: any[] = [];
        const numericValues = Object.entries(splitValues).reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val as string) || 0;
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
      setIsViewModalOpen(false); // Fecha modal de visualização se estiver aberto
      fetchDivvyData();
  };

  const handleOpenPaymentInfo = async (memberId: string) => {
    setLoadingPayments(true);
    setViewingMemberName(getMemberName(memberId).replace(' (Você)', ''));
    setIsPaymentModalOpen(true);
    setMemberPaymentMethods([]);
    setGeneratedQrCode(null);
    setActiveQrMethodId(null);
    setCopiedKey(null);

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

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Chave copiada!");
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleGenerateQR = async (text: string, methodId: string) => {
    if (!text) return;
    try {
      const url = await QRCode.toDataURL(text);
      setGeneratedQrCode(url);
      setActiveQrMethodId(methodId);
    } catch (err) {
      console.error("QR Error", err);
      toast.error("Erro ao gerar QR Code");
    }
  };

  const formatExpenseDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    return `${day}/${month}/${year}`;
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
            onClick={() => setActiveTab('balances')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'balances' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wallet size={16} /> Gastos
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
               <div 
                 key={exp.id} 
                 onClick={() => handleViewExpense(exp)}
                 className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors group"
               >
                 <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {exp.category === 'food' ? '🍽️' : 
                       exp.category === 'transport' ? '🚗' : 
                       exp.category === 'accommodation' ? '🏨' : 
                       exp.category === 'activity' ? '🎬' : 
                       exp.category === 'utilities' ? '💡' :
                       exp.category === 'shopping' ? '🛍️' : '💰'}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{exp.description || exp.category}</p>
                        <p className="text-sm text-gray-500">{formatExpenseDate(exp.date)} • {getMemberName(exp.paid_by_user_id)}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-bold text-gray-900">R$ {exp.amount.toFixed(2)}</span>
                    {!divvy.is_archived && (
                        <div className="flex gap-1">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleOpenEditExpense(exp); }} 
                             className="p-2 hover:bg-gray-200 text-gray-400 hover:text-brand-600 rounded-full transition-colors"
                             title="Editar Rápido"
                           >
                              <Pencil size={16} />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteExpense(exp.id); }} 
                             className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                             title="Excluir Rápido"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                    )}
                 </div>
               </div>
            ))}
          </div>
        )}

        {/* --- BALANCES / GASTOS TAB --- */}
        {activeTab === 'balances' && (
            <div className="space-y-8 animate-fade-in-down">
                {/* 1. Who Owes Whom (Settlement Plan) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ArrowRight size={20} className="text-brand-600" />
                        Como quitar as dívidas
                    </h3>
                    
                    {calculateBalances.plan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg">
                            <Check size={48} className="text-green-500 mb-3" />
                            <p className="text-gray-900 font-medium">Tudo quitado!</p>
                            <p className="text-sm text-gray-500">Ninguém deve nada para ninguém.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {calculateBalances.plan.map((transfer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{getMemberName(transfer.from)}</span>
                                            <span className="text-gray-400 text-xs">deve pagar</span>
                                            <span className="font-medium text-gray-900">{getMemberName(transfer.to)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-brand-600">R$ {transfer.amount.toFixed(2)}</span>
                                        <button 
                                            onClick={() => handleOpenPaymentInfo(transfer.to)}
                                            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-white rounded-full transition-colors"
                                            title="Ver dados bancários"
                                        >
                                            <CreditCard size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                * Cálculo otimizado para reduzir o número de transações necessárias.
                            </p>
                        </div>
                    )}
                </div>

                {/* 2. Balance Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo de Saldos</h3>
                        <div className="space-y-4">
                            {members.map(m => {
                                const balance = calculateBalances.balances[m.user_id] || 0;
                                const isPositive = balance > 0;
                                const isZero = Math.abs(balance) < 0.01;

                                return (
                                    <div key={m.user_id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isZero ? 'bg-gray-300' : isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="text-gray-700">{getMemberName(m.user_id)}</span>
                                        </div>
                                        <div className={`font-medium ${isZero ? 'text-gray-400' : isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                            {isZero ? 'Zerado' : (isPositive ? `recebe R$ ${balance.toFixed(2)}` : `deve R$ ${Math.abs(balance).toFixed(2)}`)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Who Paid What (Total Volume) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quem pagou o quê (Total)</h3>
                        <div className="space-y-4">
                            {members.map(m => {
                                const paid = calculateBalances.totalPaid[m.user_id] || 0;
                                const consumed = calculateBalances.totalConsumed[m.user_id] || 0;
                                
                                return (
                                    <div key={m.user_id} className="space-y-1 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-900">{getMemberName(m.user_id)}</span>
                                            <span className="font-bold text-gray-900">R$ {paid.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>Sua parte nas despesas:</span>
                                            <span>R$ {consumed.toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
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

      {/* VIEW EXPENSE MODAL (READ ONLY) */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Detalhes da Despesa"
      >
        {viewingExpense && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-2xl">
                    {viewingExpense.category === 'food' ? '🍽️' : 
                     viewingExpense.category === 'transport' ? '🚗' : 
                     viewingExpense.category === 'accommodation' ? '🏨' : 
                     viewingExpense.category === 'activity' ? '🎬' : '💰'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{viewingExpense.description || viewingExpense.category}</h3>
                    <p className="text-sm text-gray-500">{formatExpenseDate(viewingExpense.date)}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-bold text-brand-600">R$ {viewingExpense.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Pago por {getMemberName(viewingExpense.paid_by_user_id)}</p>
               </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
               <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                 <Users size={16} className="text-gray-500" />
                 Como foi dividido:
               </h4>
               
               {loadingView ? (
                 <div className="py-4 flex justify-center"><LoadingSpinner /></div>
               ) : (
                 <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {members.map(m => {
                       const split = viewingSplits.find(s => s.participant_user_id === m.user_id);
                       const amountOwed = split ? split.amount_owed : 0;
                       
                       if (amountOwed <= 0) return null;

                       return (
                         <div key={m.user_id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{getMemberName(m.user_id)}</span>
                            <span className="font-medium text-gray-900">R$ {amountOwed.toFixed(2)}</span>
                         </div>
                       );
                    })}
                 </div>
               )}
            </div>

            <div className="flex gap-3 pt-2">
               {!divvy.is_archived && (
                 <>
                  <Button 
                    variant="danger" 
                    className="flex-1"
                    onClick={() => handleDeleteExpense(viewingExpense.id)}
                  >
                    Excluir
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1"
                    onClick={() => handleOpenEditExpense(viewingExpense)}
                  >
                    Editar
                  </Button>
                 </>
               )}
               <Button 
                  variant="outline" 
                  className={divvy.is_archived ? "w-full" : ""}
                  onClick={() => setIsViewModalOpen(false)}
               >
                  Fechar
               </Button>
            </div>
          </div>
        )}
      </Modal>

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
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Pagamento para ${viewingMemberName}`}>
         <div className="space-y-4">
            {loadingPayments ? (
               <LoadingSpinner />
            ) : memberPaymentMethods.length === 0 ? (
               <p className="text-gray-500 text-center py-4">Nenhum método de pagamento disponível.</p>
            ) : (
               memberPaymentMethods.map(method => {
                  // Robust Pix detection checking both type fields and content
                  const isPix = 
                    method.method_type === 'pix' || 
                    method.type === 'pix' || 
                    (method.display_text && method.display_text.toLowerCase().includes('pix')) ||
                    !!method.pix_key ||
                    !!method.raw_pix_key;

                  const pixKey = method.raw_pix_key || method.pix_key || method.pix_key_masked;
                  const displayText = method.display_text 
                     ? method.display_text.replace(/\bcpf\b/gi, 'CPF').replace(/\bcnpj\b/gi, 'CNPJ')
                     : (isPix ? 'Pix' : 'Conta Bancária');
                  
                  return (
                    <div key={method.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{isPix ? '💠' : '🏦'}</span>
                          <h4 className="font-bold text-gray-900">{displayText}</h4>
                       </div>
                       
                       <div className="space-y-3 mt-3">
                          {isPix ? (
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <input 
                                    readOnly 
                                    value={pixKey || 'Chave indisponível'}
                                    className="flex-1 bg-white p-3 rounded border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                                  />
                                  <button 
                                     onClick={() => handleCopy(pixKey || '', method.id)}
                                     className="p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors"
                                     title="Copiar chave"
                                  >
                                     {copiedKey === method.id ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                                  </button>
                                </div>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  fullWidth 
                                  onClick={() => handleGenerateQR(pixKey || '', method.id)}
                                  className="flex items-center justify-center gap-2"
                                  disabled={!pixKey}
                                >
                                  <QrCode size={16} />
                                  Gerar QR Code
                                </Button>
                                
                                {activeQrMethodId === method.id && generatedQrCode && (
                                   <div className="flex flex-col items-center justify-center p-4 bg-white rounded border border-gray-200 animate-fade-in-down">
                                      <img src={generatedQrCode} alt="QR Code Pix" className="w-48 h-48" />
                                      <p className="text-xs text-gray-500 mt-2">Escaneie para pagar</p>
                                   </div>
                                )}
                             </div>
                          ) : (
                             <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 space-y-1">
                                <p><span className="font-semibold">Banco:</span> {method.bank_name || method.banks?.name || 'N/A'}</p>
                                <p><span className="font-semibold">Agência:</span> {method.raw_agency || method.agency || method.agency_masked || '-'}</p>
                                <p>
                                    <span className="font-semibold">Conta:</span>{' '}
                                    {method.raw_account_number || method.account_number || method.account_number_masked || '-'}
                                    {(method.raw_account_digit || method.account_digit) ? `-${method.raw_account_digit || method.account_digit}` : ''}
                                </p>
                                <p><span className="font-semibold">Titular:</span> {method.account_holder_name || '-'}</p>
                             </div>
                          )}
                       </div>
                    </div>
                  );
               })
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
