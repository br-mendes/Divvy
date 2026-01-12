
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense, ExpenseSplit, PaymentMethod, Settlement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ExpenseCharts } from '../../components/Charts';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import InviteModal from '../../components/invite/InviteModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, UserPlus, Receipt, PieChart, Users, CreditCard, Lock, Copy, QrCode, Check, ArrowRight, Wallet, TrendingUp, TrendingDown, ShieldAlert, Clock, XCircle, CheckCircle } from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import Link from 'next/link';

type SplitMode = 'equal' | 'amount' | 'percentage';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const divvyId = typeof id === 'string' ? id : '';
  
  // --- Data State ---
  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [members, setMembers] = useState<DivvyMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allSplits, setAllSplits] = useState<ExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'charts' | 'members'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // --- View Expense State ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [viewingSplits, setViewingSplits] = useState<ExpenseSplit[]>([]);
  const [loadingView, setLoadingView] = useState(false);

  // --- Payment Info State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewingMemberName, setViewingMemberName] = useState('');
  const [payingToId, setPayingToId] = useState<string | null>(null);
  const [memberPaymentMethods, setMemberPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // --- QR Code State ---
  const [generatedQrCode, setGeneratedQrCode] = useState<string | null>(null);
  const [activeQrMethodId, setActiveQrMethodId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Expense Form State ---
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // --- Advanced Split Logic State ---
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
      setAccessDenied(false);
      
      // Tentamos o RPC principal que consolida os dados
      const { data, error } = await supabase.rpc('get_divvy_details_complete', {
         p_divvy_id: divvyId
      });

      if (error) throw error;

      if (!data || !data.divvy) {
         // Fallback manual se o RPC não retornar dados (ex: problema de RLS no RPC ou ID inválido)
         const { data: divvyDirect } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
         if (!divvyDirect) {
            setAccessDenied(true);
            setLoading(false);
            return;
         }
         
         // Se conseguimos o grupo, buscamos o restante manualmente para garantir visibilidade
         const [membersRes, expensesRes, settlementsRes] = await Promise.all([
            supabase.from('divvy_members').select('*, profiles(*)').eq('divvy_id', divvyId),
            supabase.from('expenses').select('*').eq('divvy_id', divvyId).order('date', { ascending: false }),
            supabase.from('settlements').select('*').eq('divvy_id', divvyId)
         ]);

         setDivvy(divvyDirect);
         setMembers(membersRes.data || []);
         setExpenses(expensesRes.data || []);
         setSettlements(settlementsRes.data || []);

         // Buscar splits das despesas encontradas
         if (expensesRes.data && expensesRes.data.length > 0) {
            const expIds = expensesRes.data.map(e => e.id);
            const { data: splitData } = await supabase.from('expense_splits').select('*').in('expense_id', expIds);
            setAllSplits(splitData || []);
         }
      } else {
         // Sucesso via RPC
         setDivvy(data.divvy);
         setMembers(data.members || []);
         setExpenses(data.expenses || []);
         setAllSplits(data.splits || []);
         setSettlements(data.settlements || []);
      }

    } catch (error: any) {
      console.error("Fetch Error:", error);
      toast.error("Erro ao sincronizar dados do grupo.");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const getMemberName = (userId: string, includeYouSuffix = true) => {
    const member = members.find(m => m.user_id === userId);
    if (!member) return 'Usuário...';
    
    const isMe = userId === user?.id;
    const profile = member.profiles;
    let displayName = '';

    if (profile?.nickname && profile.nickname.trim()) {
      displayName = profile.nickname;
    } else if (profile?.full_name && profile.full_name.trim()) {
      displayName = profile.full_name;
    } else if (member.email) {
      displayName = member.email.split('@')[0];
    } else {
      displayName = 'Membro';
    }
    
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    if (isMe && includeYouSuffix) {
        return `${displayName} (Você)`;
    }
    return displayName;
  };

  const calculateBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    const totalPaid: Record<string, number> = {};
    const totalConsumed: Record<string, number> = {};

    members.forEach(m => {
        balances[m.user_id] = 0;
        totalPaid[m.user_id] = 0;
        totalConsumed[m.user_id] = 0;
    });

    expenses.forEach(exp => {
        const amount = exp.amount;
        if (totalPaid[exp.paid_by_user_id] !== undefined) {
            totalPaid[exp.paid_by_user_id] += amount;
            balances[exp.paid_by_user_id] += amount;
        }
    });

    allSplits.forEach(split => {
        const val = split.amount_owed || 0;
        if (totalConsumed[split.participant_user_id] !== undefined) {
            totalConsumed[split.participant_user_id] += val;
            balances[split.participant_user_id] -= val;
        }
    });

    settlements.forEach(s => {
      if (s.status === 'confirmed') {
        if (balances[s.payer_id] !== undefined) balances[s.payer_id] += s.amount;
        if (balances[s.receiver_id] !== undefined) balances[s.receiver_id] -= s.amount;
      }
    });

    const debtors: { id: string, amount: number }[] = [];
    const creditors: { id: string, amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        const rounded = Math.round(amount * 100) / 100;
        if (rounded < -0.01) debtors.push({ id, amount: rounded });
        if (rounded > 0.01) creditors.push({ id, amount: rounded });
    });

    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const plan: { from: string, to: string, amount: number }[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
        
        if (amount > 0.01) {
            plan.push({ from: debtor.id, to: creditor.id, amount });
        }
        debtor.amount += amount;
        creditor.amount -= amount;
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return { balances, totalPaid, totalConsumed, plan };
  }, [expenses, allSplits, members, settlements]);

  const handleViewExpense = async (exp: Expense) => {
    setViewingExpense(exp);
    setIsViewModalOpen(true);
    setLoadingView(true);
    setViewingSplits([]);
    
    const splits = allSplits.filter(s => s.expense_id === exp.id);
    if (splits.length > 0) {
        setViewingSplits(splits);
        setLoadingView(false);
    } else {
        try {
            const { data } = await supabase.from('expense_splits').select('*').eq('expense_id', exp.id);
            if (data) setViewingSplits(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingView(false);
        }
    }
  };

  const handleOpenAddExpense = () => {
    if (!user) return;
    if (divvy?.is_archived) {
       toast.error("Grupo arquivado.");
       return;
    }
    setEditingExpenseId(null);
    setAmount('');
    setCategory('food');
    setDesc('');
    setDate(new Date().toISOString().split('T')[0]);
    setPayerId(user.id);
    
    setSplitMode('equal');
    const initialSplits: Record<string, string> = {};
    members.forEach(m => initialSplits[m.user_id] = "1");
    setSplitValues(initialSplits);

    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = async (exp: Expense) => {
    if (divvy?.is_archived) return;
    setIsViewModalOpen(false);

    setEditingExpenseId(exp.id);
    setAmount(String(exp.amount)); 
    setCategory(exp.category);
    setDesc(exp.description);
    setDate(String(exp.date).split('T')[0]); 
    setPayerId(exp.paid_by_user_id);

    let splits = allSplits.filter(s => s.expense_id === exp.id);
    
    if (splits.length === 0) {
        const { data } = await supabase.from('expense_splits').select('*').eq('expense_id', exp.id);
        if (data) splits = data;
    }

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

  const handleMarkAsPaid = async (receiverId: string, amount: number) => {
     if (!confirm(`Confirmar que você pagou ${formatMoney(amount)} para ${getMemberName(receiverId, false)}?`)) return;
     if (!user) return;

     const loadingToast = toast.loading('Processando...');
     try {
       const { error } = await supabase.from('settlements').insert({
          divvy_id: divvyId,
          payer_id: user.id,
          receiver_id: receiverId,
          amount: amount,
          status: 'pending'
       });

       if (error) throw error;
       
       await supabase.from('notifications').insert({
         user_id: receiverId,
         divvy_id: divvyId,
         title: 'Pagamento Recebido?',
         message: `${getMemberName(user.id, false)} informou que pagou ${formatMoney(amount)}. Confirme o recebimento.`,
         type: 'settlement'
       });

       toast.success('Marcado como pago! Aguardando confirmação.', { id: loadingToast });
       fetchDivvyData();
     } catch (e: any) {
       toast.error(e.message, { id: loadingToast });
     }
  };

  const handleUpdateSettlement = async (settlementId: string, newStatus: 'confirmed' | 'rejected') => {
      const action = newStatus === 'confirmed' ? 'Confirmar' : 'Rejeitar';
      if (!confirm(`Deseja ${action} este pagamento?`)) return;

      const loadingToast = toast.loading(`${action} recebimento...`);
      try {
        const { data, error } = await supabase.from('settlements')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', settlementId)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
           const title = newStatus === 'confirmed' ? 'Pagamento Confirmado!' : 'Pagamento Rejeitado';
           const msg = newStatus === 'confirmed' 
             ? `${getMemberName(user!.id, false)} confirmou seu pagamento de ${formatMoney(data.amount)}.`
             : `${getMemberName(user!.id, false)} rejeitou seu informe de pagamento. Verifique o comprovante.`;

           await supabase.from('notifications').insert({
             user_id: data.payer_id,
             divvy_id: divvyId,
             title: title,
             message: msg,
             type: 'settlement'
           });
        }

        toast.success(`Pagamento ${newStatus === 'confirmed' ? 'confirmado' : 'rejeitado'}!`, { id: loadingToast });
        fetchDivvyData();
      } catch (e: any) {
         toast.error(e.message, { id: loadingToast });
      }
  };

  const totalAmount = parseFloat(amount) || 0;
  
  const toggleMemberSelection = (userId: string) => {
      setSplitValues(prev => ({
          ...prev,
          [userId]: prev[userId] === "1" ? "0" : "1"
      }));
  };

  const handleSplitValueChange = (userId: string, value: string) => {
      setSplitValues(prev => ({
          ...prev,
          [userId]: value
      }));
  };

  const getSplitSummary = (): { isValid: boolean; message: string } => {
      if (totalAmount <= 0) return { isValid: false, message: 'Insira um valor válido' };
      const numericValues = Object.entries(splitValues).reduce((acc, [key, val]) => {
          acc[key] = parseFloat(val as string) || 0;
          return acc;
      }, {} as Record<string, number>);

      if (splitMode === 'equal') {
          const selectedCount = Object.values(numericValues).filter(v => v === 1).length;
          if (selectedCount === 0) return { isValid: false, message: 'Selecione alguém' };
          const perPerson = totalAmount / selectedCount;
          return { isValid: true, message: `${formatMoney(perPerson)} / pessoa` };
      } 
      
      const currentSum = Object.values(numericValues).reduce((a, b) => a + b, 0);
      if (splitMode === 'amount') {
          const diff = totalAmount - currentSum;
          const isValid = Math.abs(diff) < 0.05; 
          if (isValid) return { isValid: true, message: 'OK' };
          return { isValid: false, message: diff > 0 ? `Faltam ${formatMoney(Math.abs(diff))}` : `Sobraram ${formatMoney(Math.abs(diff))}` };
      }
      if (splitMode === 'percentage') {
          const diff = 100 - currentSum;
          const isValid = Math.abs(diff) < 0.1;
          if (isValid) return { isValid: true, message: 'Total: 100%' };
          return { isValid: false, message: diff > 0 ? `Faltam ${Math.abs(diff).toFixed(1)}%` : `Sobraram ${Math.abs(diff).toFixed(1)}%` };
      }
      return { isValid: false, message: '' };
  };

  const { isValid: isSplitValid, message: splitMessage } = getSplitSummary();

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
        const { data, error: insertError } = await supabase.from('expenses').insert(expenseData).select().single();
        if (insertError) throw insertError;
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
          splitsToInsert = members.filter(m => numericValues[m.user_id] > 0).map(m => ({
              expense_id: expenseId,
              participant_user_id: m.user_id,
              amount_owed: numericValues[m.user_id]
            }));
        } else if (splitMode === 'percentage') {
           splitsToInsert = members.filter(m => numericValues[m.user_id] > 0).map(m => ({
              expense_id: expenseId,
              participant_user_id: m.user_id,
              amount_owed: totalAmount * (numericValues[m.user_id] / 100)
            }));
        }

        if (splitsToInsert.length > 0) {
           await supabase.from('expense_splits').insert(splitsToInsert);
        }

        if (!editingExpenseId) {
           const payerName = getMemberName(payerId, false);
           const otherMembers = members.filter(m => m.user_id !== user.id);
           
           const notifications = otherMembers.map(m => ({
              user_id: m.user_id,
              divvy_id: divvy.id,
              title: 'Nova Despesa',
              message: `${payerName} adicionou "${desc || category}" no valor de ${formatMoney(totalAmount)}.`,
              type: 'expense'
           }));
           
           if (notifications.length > 0) {
              await supabase.from('notifications').insert(notifications);
           }
        }
      }

      toast.success(editingExpenseId ? 'Despesa salva!' : 'Despesa criada!');
      setIsExpenseModalOpen(false);
      fetchDivvyData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
      if (!confirm('Excluir esta despesa permanentemente?')) return;
      await supabase.from('expenses').delete().eq('id', expenseId);
      setIsViewModalOpen(false);
      fetchDivvyData();
  };

  const handleOpenPaymentInfo = async (memberId: string) => {
    setLoadingPayments(true);
    setViewingMemberName(getMemberName(memberId, false));
    setPayingToId(memberId);
    setIsPaymentModalOpen(true);
    setMemberPaymentMethods([]);
    setGeneratedQrCode(null);
    setActiveQrMethodId(null);
    setCopiedKey(null);

    try {
        const { data, error } = await supabase.rpc('get_divvy_members_payment_methods', { p_divvy_id: divvyId });
        if (error) throw error;
        const memberMethods = (data || []).filter((m: any) => m.member_id === memberId);
        setMemberPaymentMethods(memberMethods);
    } catch (error: any) {
        toast.error("Erro ao buscar dados de pagamento.");
    } finally {
        setLoadingPayments(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateQR = async (text: string, methodId: string) => {
    if (!text) return;
    try {
      const url = await QRCode.toDataURL(text);
      setGeneratedQrCode(url);
      setActiveQrMethodId(methodId);
    } catch (err) {
      toast.error("Erro ao gerar QR Code");
    }
  };

  const pendingApprovals = useMemo(() => {
     if (!user) return [];
     return settlements.filter(s => s.receiver_id === user.id && s.status === 'pending');
  }, [settlements, user]);

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  
  if (accessDenied || !divvy) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700">
           <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
           <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
              Você não tem permissão para visualizar este grupo ou ele não existe. 
              Certifique-se de que foi convidado e aceitou o convite.
           </p>
           <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
           </Link>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy} onUpdate={fetchDivvyData} />

      {divvy.is_archived && (
        <div className="bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 p-4 rounded-lg flex items-center gap-3">
          <Lock size={20} />
          <div>
            <p className="font-bold">Grupo Arquivado</p>
            <p className="text-sm">Você pode visualizar, mas não pode editar.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Convidar
        </Button>
        <Button onClick={handleOpenAddExpense} disabled={divvy.is_archived} className={divvy.is_archived ? "opacity-50 cursor-not-allowed" : ""}>
          <Plus size={18} className="mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { id: 'expenses', label: 'Despesas', icon: Receipt },
            { id: 'balances', label: 'Gastos', icon: Wallet },
            { id: 'charts', label: 'Análise', icon: PieChart },
            { id: 'members', label: `Membros (${members.length})`, icon: Users },
          ].map((tab) => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
          ))}
        </nav>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? <EmptyState /> : expenses.map((exp) => (
               <div 
                 key={exp.id} 
                 onClick={() => { handleViewExpense(exp); }}
                 className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
               >
                 <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {exp.category === 'food' ? '🍽️' : exp.category === 'transport' ? '🚗' : exp.category === 'accommodation' ? '🏨' : exp.category === 'activity' ? '🎬' : '💰'}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{exp.description || exp.category}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(exp.date)} • Pago por <strong>{getMemberName(exp.paid_by_user_id, false)}</strong>
                        </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-bold text-gray-900 dark:text-white">{formatMoney(exp.amount)}</span>
                 </div>
               </div>
            ))}
          </div>
        )}

        {/* TAB 2: BALANCES (GASTOS) */}
        {activeTab === 'balances' && (
            <div className="space-y-8 animate-fade-in-down">
                
                {/* Pending Approvals Section */}
                {pendingApprovals.length > 0 && (
                   <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-xl border border-yellow-200 dark:border-yellow-900/30 shadow-sm">
                      <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-500 mb-4 flex items-center gap-2">
                          <Clock size={20} />
                          Aprovações Pendentes
                      </h3>
                      <div className="space-y-3">
                        {pendingApprovals.map(s => (
                           <div key={s.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-dark-800 rounded-lg border border-yellow-100 dark:border-yellow-900/20 shadow-sm">
                              <div className="mb-2 sm:mb-0">
                                 <p className="text-gray-900 dark:text-gray-100 font-medium">
                                    <span className="font-bold">{getMemberName(s.payer_id, false)}</span> disse que pagou <span className="font-bold text-green-600 dark:text-green-400">{formatMoney(s.amount)}</span> para você.
                                 </p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(s.created_at).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="flex gap-2">
                                 <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-900/30 dark:text-red-400" onClick={() => handleUpdateSettlement(s.id, 'rejected')}>
                                    <XCircle size={16} className="mr-1" /> Rejeitar
                                 </Button>
                                 <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateSettlement(s.id, 'confirmed')}>
                                    <CheckCircle size={16} className="mr-1" /> Confirmar
                                 </Button>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Section 1: Debt Settlement Plan */}
                <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ArrowRight size={20} className="text-brand-600 dark:text-brand-400" />
                        Plano de Pagamentos
                    </h3>
                    
                    {calculateBalances.plan.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 dark:bg-dark-700/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
                            <Check size={48} className="text-green-500 mb-3" />
                            <p className="text-gray-900 dark:text-white font-medium">Tudo quitado!</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ninguém deve nada para ninguém.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {calculateBalances.plan.map((transfer, idx) => {
                                const myPending = settlements.find(s => 
                                    s.payer_id === transfer.from && 
                                    s.receiver_id === transfer.to && 
                                    s.status === 'pending'
                                );

                                const isMeDebtor = transfer.from === user?.id;

                                return (
                                <div key={idx} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/30 rounded-lg border border-gray-100 dark:border-dark-700 hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto mb-3 sm:mb-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 text-xs font-bold">
                                                {getMemberName(transfer.from, false).charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{getMemberName(transfer.from, false)}</span>
                                        </div>
                                        
                                        <div className="hidden sm:flex flex-col items-center px-4">
                                            <span className="text-xs text-gray-400">paga para</span>
                                            <ArrowRight size={14} className="text-gray-400" />
                                        </div>
                                        <div className="sm:hidden text-xs text-gray-400 pl-10">paga para</div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                                                {getMemberName(transfer.to, false).charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{getMemberName(transfer.to, false)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pl-0 sm:pl-4 sm:border-l border-gray-200 dark:border-gray-600">
                                        <span className="font-bold text-lg text-brand-600 dark:text-brand-400">{formatMoney(transfer.amount)}</span>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleOpenPaymentInfo(transfer.to)}
                                                className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-dark-800 rounded-full transition-colors"
                                                title="Ver dados bancários"
                                            >
                                                <CreditCard size={18} />
                                            </button>

                                            {isMeDebtor && (
                                               myPending ? (
                                                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-900/50 flex items-center gap-1">
                                                     <Clock size={12} /> Aguardando
                                                  </span>
                                               ) : (
                                                  <Button 
                                                    size="sm" 
                                                    onClick={() => handleMarkAsPaid(transfer.to, transfer.amount)}
                                                    title="Marcar como pago"
                                                    className="bg-green-600 hover:bg-green-700 text-white border-none h-8"
                                                  >
                                                     Pagar
                                                  </Button>
                                               )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Section 2: Visual Net Balance */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Balanço Geral</h3>
                        <div className="space-y-4">
                            {members.map(m => {
                                const balance = calculateBalances.balances[m.user_id] || 0;
                                const isPositive = balance > 0.01;
                                const isNegative = balance < -0.01;
                                const isZero = !isPositive && !isNegative;

                                return (
                                    <div key={m.user_id} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{getMemberName(m.user_id)}</span>
                                            <span className={`font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                                                {isZero ? 'Zerado' : (isPositive ? `+ ${formatMoney(balance)}` : `- ${formatMoney(Math.abs(balance))}`)}
                                            </span>
                                        </div>
                                        {/* Visual Bar */}
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden flex">
                                            {isPositive && <div className="h-full bg-green-500" style={{ width: '100%' }}></div>}
                                            {isNegative && <div className="h-full bg-red-500" style={{ width: '100%' }}></div>}
                                            {isZero && <div className="h-full bg-gray-300 dark:bg-gray-600 w-full"></div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detalhes de Consumo</h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {members.map(m => {
                                const paid = calculateBalances.totalPaid[m.user_id] || 0;
                                const consumed = calculateBalances.totalConsumed[m.user_id] || 0;
                                
                                return (
                                    <div key={m.user_id} className="p-3 bg-gray-50 dark:bg-dark-700/30 rounded-lg border border-gray-100 dark:border-dark-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{getMemberName(m.user_id, false)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                                            <span className="flex items-center gap-1"><TrendingUp size={12} className="text-green-500"/> Pagou:</span>
                                            <span className="font-medium">{formatMoney(paid)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><TrendingDown size={12} className="text-red-500"/> Consumiu:</span>
                                            <span className="font-medium">{formatMoney(consumed)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 3: CHARTS */}
        {activeTab === 'charts' && (
          <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-gray-100 dark:border-dark-700">
             <ExpenseCharts expenses={expenses} />
          </div>
        )}

        {/* TAB 4: MEMBERS */}
        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(member => {
              const avatar = member.profiles?.avatar_url;
              const name = getMemberName(member.user_id, false); 
              const roleLabel = divvy.creator_id === member.user_id ? "Criador e Membro" : "Membro";
              
              return (
                <div key={member.id} className="bg-white dark:bg-dark-800 p-4 rounded-lg border border-gray-100 dark:border-dark-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                       <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-dark-600" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{roleLabel}</p>
                    </div>
                  </div>
                  <button 
                     onClick={() => handleOpenPaymentInfo(member.user_id)}
                     className="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-2 rounded-full transition-colors"
                  >
                     <CreditCard size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* View Expense Detail Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Despesa">
        {viewingExpense && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewingExpense.description || viewingExpense.category}</h3>
               <div className="text-right">
                  <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{formatMoney(viewingExpense.amount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pago por {getMemberName(viewingExpense.paid_by_user_id)}</p>
               </div>
            </div>
            <div className="border-t border-gray-100 dark:border-dark-700 pt-4">
               <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2"><Users size={16} /> Como foi dividido:</h4>
               {loadingView ? <LoadingSpinner /> : (
                 <div className="bg-gray-50 dark:bg-dark-700/30 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {members.map(m => {
                       const split = viewingSplits.find(s => s.participant_user_id === m.user_id);
                       const amountOwed = split ? split.amount_owed : 0;
                       if (amountOwed <= 0) return null;
                       return (
                         <div key={m.user_id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{getMemberName(m.user_id)}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatMoney(amountOwed)}</span>
                         </div>
                       );
                    })}
                 </div>
               )}
            </div>
            <div className="flex gap-3 pt-2">
               {!divvy.is_archived && (
                 <>
                  <Button variant="danger" className="flex-1" onClick={() => handleDeleteExpense(viewingExpense.id)}>Excluir</Button>
                  <Button variant="primary" className="flex-1" onClick={() => handleOpenEditExpense(viewingExpense)}>Editar</Button>
                 </>
               )}
               <Button variant="outline" className={divvy.is_archived ? "w-full" : ""} onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title={editingExpenseId ? "Editar Despesa" : "Nova Despesa"}>
         <form onSubmit={handleSaveExpense} className="space-y-5">
           <div className="space-y-3">
              <Input label="Valor (R$)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className="text-lg font-bold" />
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                    <select className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="food">🍽️ Alimentação</option>
                      <option value="transport">🚗 Transporte</option>
                      <option value="accommodation">🏨 Hospedagem</option>
                      <option value="activity">🎬 Atividade</option>
                      <option value="utilities">💡 Contas</option>
                      <option value="shopping">🛍️ Compras</option>
                      <option value="other">💰 Outros</option>
                    </select>
                  </div>
                  <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <Input label="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Jantar no centro" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quem pagou?</label>
                <select className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{getMemberName(m.user_id)}</option>
                  ))}
                </select>
              </div>
           </div>
           <hr className="border-gray-200 dark:border-gray-700" />
           <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Divisão</label>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-3">
                <button type="button" onClick={() => setSplitMode('equal')} className={`flex-1 py-1.5 text-sm font-medium rounded-md ${splitMode === 'equal' ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400'}`}>Igual</button>
                <button type="button" onClick={() => setSplitMode('amount')} className={`flex-1 py-1.5 text-sm font-medium rounded-md ${splitMode === 'amount' ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400'}`}>Valor (R$)</button>
                <button type="button" onClick={() => setSplitMode('percentage')} className={`flex-1 py-1.5 text-sm font-medium rounded-md ${splitMode === 'percentage' ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-gray-400'}`}>%</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {members.map(m => {
                  const isSelected = splitValues[m.user_id] === "1";
                  const selectedCount = Object.values(splitValues).filter(v => v === "1").length;
                  const equalValue = selectedCount > 0 ? totalAmount / selectedCount : 0;
                  return (
                    <div key={m.user_id} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {splitMode === 'equal' && (
                           <input type="checkbox" checked={isSelected} onChange={() => toggleMemberSelection(m.user_id)} className="w-4 h-4 text-brand-600 rounded border-gray-300" />
                        )}
                        <span className={`text-sm truncate ${splitMode === 'equal' && !isSelected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{getMemberName(m.user_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {splitMode === 'equal' ? (
                           isSelected ? <span className="text-sm font-medium text-gray-900 dark:text-white">{formatMoney(equalValue)}</span> : <span className="text-xs text-gray-400">-</span>
                        ) : (
                           <input type="number" step={splitMode === 'amount' ? "0.01" : "1"} value={splitValues[m.user_id] || ''} onChange={(e) => handleSplitValueChange(m.user_id, e.target.value)} className="w-24 pl-2 py-1 text-right text-sm border rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" placeholder="0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`mt-2 text-sm text-right font-medium ${isSplitValid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{splitMessage}</div>
           </div>
           <div className="flex justify-end gap-3 pt-2">
             <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
             <Button type="submit" isLoading={submitLoading} disabled={!isSplitValid}>Salvar</Button>
           </div>
         </form>
      </Modal>

      {/* Payment Info Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Pagamento para ${viewingMemberName}`}>
         <div className="space-y-4">
            {loadingPayments ? <LoadingSpinner /> : memberPaymentMethods.length === 0 ? <p className="text-gray-500 text-center py-4">Nenhum método de pagamento cadastrado.</p> : memberPaymentMethods.map(method => {
                  const isPix = method.method_type === 'pix' || method.type === 'pix' || !!method.pix_key;
                  const pixKey = method.raw_pix_key || method.pix_key || method.pix_key_masked;
                  
                  return (
                    <div key={method.id} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4 bg-gray-50 dark:bg-dark-700/30">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{isPix ? '💠' : '🏦'}</span>
                          <h4 className="font-bold text-gray-900 dark:text-white">{isPix ? 'Pix' : 'Conta Bancária'}</h4>
                       </div>
                       
                       <div className="space-y-3 mt-3">
                          {isPix ? (
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <input readOnly value={pixKey || 'Chave indisponível'} className="flex-1 bg-white dark:bg-dark-800 p-3 rounded border border-gray-200 dark:border-dark-600 font-mono text-sm text-gray-800 dark:text-gray-200" />
                                  <button onClick={() => handleCopy(pixKey || '', method.id)} className="p-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded hover:bg-gray-50 dark:hover:bg-dark-700">
                                     {copiedKey === method.id ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-gray-500 dark:text-gray-400" />}
                                  </button>
                                </div>
                                <Button variant="outline" size="sm" fullWidth onClick={() => handleGenerateQR(pixKey || '', method.id)} disabled={!pixKey} className="flex items-center justify-center gap-2"><QrCode size={16} /> Gerar QR Code</Button>
                                {activeQrMethodId === method.id && generatedQrCode && (
                                   <div className="flex flex-col items-center justify-center p-4 bg-white rounded border border-gray-200">
                                      <img src={generatedQrCode} alt="QR Code Pix" className="w-48 h-48" />
                                   </div>
                                )}
                             </div>
                          ) : (
                             <div className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-800 p-3 rounded border border-gray-200 dark:border-dark-600 space-y-1">
                                <p><span className="font-semibold">Banco:</span> {(method as any).bank_code} - {method.bank_name}</p>
                                <p><span className="font-semibold">Agência:</span> {method.agency || method.raw_agency}</p>
                                <p><span className="font-semibold">Conta:</span> {method.account_number || method.raw_account_number}</p>
                             </div>
                          )}
                       </div>
                    </div>
                  );
               })}
            
            {payingToId && payingToId !== user?.id && !divvy?.is_archived && (
               <Button 
                 variant="primary" 
                 fullWidth 
                 className="mt-4" 
                 onClick={() => { setIsPaymentModalOpen(false); setActiveTab('balances'); toast("Use o botão 'Pagar' na aba Gastos", { icon: '💡' }); }}
               >
                 Ir para Pagamentos
               </Button>
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
