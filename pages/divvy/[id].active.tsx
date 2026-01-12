
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
import { 
  Plus, UserPlus, Receipt, PieChart, Users, CreditCard, Lock, Copy, 
  ArrowRight, Wallet, CheckCircle, Info, Archive, Clock, Check, XCircle 
} from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

type SplitMode = 'equal' | 'amount' | 'percentage';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const divvyId = typeof id === 'string' ? id : '';
  
  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [members, setMembers] = useState<DivvyMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allSplits, setAllSplits] = useState<ExpenseSplit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'charts' | 'members'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [viewingSplits, setViewingSplits] = useState<ExpenseSplit[]>([]);
  const [memberPaymentMethods, setMemberPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (divvyId && user) fetchDivvyData();
  }, [divvyId, user]);

  const fetchDivvyData = async () => {
    try {
      const { data: divvyData } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
      const { data: memberData } = await supabase.from('divvy_members').select('*, profiles(*)').eq('divvy_id', divvyId);
      const { data: expenseData } = await supabase.from('expenses').select('*').eq('divvy_id', divvyId).order('date', { ascending: false });
      const { data: settlementData } = await supabase.from('settlements').select('*').eq('divvy_id', divvyId).order('created_at', { ascending: false });

      setDivvy(divvyData);
      setMembers(memberData || []);
      setExpenses(expenseData || []);
      setSettlements(settlementData || []);

      if (expenseData && expenseData.length > 0) {
        const { data: splitData } = await supabase.from('expense_splits').select('*').in('expense_id', expenseData.map(e => e.id));
        setAllSplits(splitData || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    members.forEach(m => balances[m.user_id] = 0);
    expenses.forEach(e => balances[e.paid_by_user_id] += e.amount);
    allSplits.forEach(s => balances[s.participant_user_id] -= s.amount_owed);
    settlements.filter(s => s.status === 'confirmed').forEach(s => {
      balances[s.payer_id] += s.amount;
      balances[s.receiver_id] -= s.amount;
    });

    const plan: { from: string; to: string; amount: number }[] = [];
    const debtors = Object.entries(balances).filter(([_, b]) => b < -0.01).map(([id, b]) => ({ id, b: Math.abs(b) }));
    const creditors = Object.entries(balances).filter(([_, b]) => b > 0.01).map(([id, b]) => ({ id, b }));

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].b, creditors[j].b);
      plan.push({ from: debtors[i].id, to: creditors[j].id, amount });
      debtors[i].b -= amount;
      creditors[j].b -= amount;
      if (debtors[i].b < 0.01) i++;
      if (creditors[j].b < 0.01) j++;
    }

    const lastConfirmed = settlements.filter(s => s.status === 'confirmed')[0];
    const isGroupBalanced = plan.length === 0 && expenses.length > 0;

    return { plan, isGroupBalanced, lastConfirmedDate: lastConfirmed ? new Date(lastConfirmed.created_at) : null };
  }, [expenses, allSplits, members, settlements]);

  const isExpenseLocked = (exp: Expense) => {
    if (!calculateBalances.isGroupBalanced || !calculateBalances.lastConfirmedDate) return false;
    return new Date(exp.created_at) <= calculateBalances.lastConfirmedDate;
  };

  const handleMarkAsPaid = async (to: string, amount: number) => {
    if (!confirm(`Confirmar envio de ${formatMoney(amount)}?`)) return;
    try {
      const { data, error } = await supabase.from('settlements').insert({
        divvy_id: divvyId, payer_id: user?.id, receiver_id: to, amount, status: 'pending'
      }).select().single();
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: to, divvy_id: divvyId, type: 'settlement',
        title: 'Pagamento enviado', message: `${getMemberName(user?.id!)} informou que te pagou ${formatMoney(amount)}.`
      });
      toast.success('Pagamento enviado! Aguardando confirmação.');
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateSettlement = async (s: Settlement, status: 'confirmed' | 'rejected') => {
    try {
      await supabase.from('settlements').update({ status }).eq('id', s.id);
      await supabase.from('notifications').insert({
        user_id: s.payer_id, divvy_id: divvyId, type: 'settlement',
        title: status === 'confirmed' ? 'Pagamento confirmado' : 'Pagamento recusado',
        message: `${getMemberName(s.receiver_id)} ${status === 'confirmed' ? 'confirmou' : 'recusou'} seu pagamento de ${formatMoney(s.amount)}.`
      });
      toast.success(`Pagamento ${status === 'confirmed' ? 'confirmado' : 'recusado'}.`);
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRequestPayment = async (to: string) => {
    try {
      await supabase.from('notifications').insert({
        user_id: to, divvy_id: divvyId, type: 'info',
        title: 'Solicitação de Pagamento', message: `${getMemberName(user?.id!)} solicitou seus dados para te pagar.`
      });
      toast.success('Solicitação enviada!');
    } catch (e: any) { toast.error(e.message); }
  };

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.user_id === uid);
    return m?.profiles?.nickname || m?.profiles?.full_name || m?.email.split('@')[0] || 'Membro';
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy!} onUpdate={fetchDivvyData} />

      {calculateBalances.isGroupBalanced && !divvy?.is_archived && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 p-4 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-brand-600" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Tudo quitado!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deseja arquivar este grupo para limpeza?</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.from('divvies').update({ is_archived: true }).eq('id', divvyId).then(() => router.push('/dashboard'))}>
            Arquivar
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus size={18} className="mr-2" /> Convidar</Button>
        <Button onClick={() => { setEditingExpenseId(null); setAmount(''); setIsExpenseModalOpen(true); }} disabled={divvy?.is_archived}><Plus size={18} className="mr-2" /> Despesa</Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex space-x-8">
          {['expenses', 'balances', 'charts', 'members'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'}`}>
              {t === 'expenses' ? 'Despesas' : t === 'balances' ? 'Balanços' : t === 'charts' ? 'Análise' : 'Membros'}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.map(exp => (
              <div key={exp.id} onClick={() => { setViewingExpense(exp); setIsViewModalOpen(true); }} className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl">{exp.category === 'food' ? '🍽️' : '💰'}</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {exp.description || exp.category}
                      {isExpenseLocked(exp) && <Lock size={12} className="text-gray-400" />}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {getMemberName(exp.paid_by_user_id)}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{formatMoney(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            {settlements.filter(s => s.status === 'pending' && s.receiver_id === user?.id).map(s => (
              <div key={s.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 flex justify-between items-center">
                <p className="text-sm font-medium"><b>{getMemberName(s.payer_id)}</b> te enviou <b>{formatMoney(s.amount)}</b></p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleUpdateSettlement(s, 'rejected')}>Recusar</Button>
                  <Button size="sm" className="bg-green-600" onClick={() => handleUpdateSettlement(s, 'confirmed')}>Confirmar</Button>
                </div>
              </div>
            ))}

            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Wallet size={18} className="text-brand-500" /> Acerto de Contas</h3>
              <div className="space-y-3">
                {calculateBalances.plan.map((p, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl flex justify-between items-center">
                    <span className="text-sm font-medium">{getMemberName(p.from)} → {getMemberName(p.to)}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-600">{formatMoney(p.amount)}</span>
                      {p.from === user?.id && (
                        <div className="flex gap-2">
                           <button onClick={() => handleRequestPayment(p.to)} className="p-2 text-gray-400 hover:text-brand-500"><Info size={16} /></button>
                           <Button size="sm" onClick={() => handleMarkAsPaid(p.to, p.amount)}>Paguei</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Despesa">
        {viewingExpense && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{viewingExpense.description}</h3>
              <span className="text-xl font-black text-brand-600">{formatMoney(viewingExpense.amount)}</span>
            </div>
            {isExpenseLocked(viewingExpense) && (
              <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded flex items-center gap-2"><Lock size={12}/> Esta despesa está bloqueada por já ter sido quitada.</p>
            )}
            <div className="flex gap-2">
              <Button fullWidth variant="outline" disabled={isExpenseLocked(viewingExpense)}>Editar</Button>
              <Button fullWidth variant="outline" className="text-red-500" disabled={isExpenseLocked(viewingExpense)}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>

      <InviteModal divvyId={divvyId} divvyName={divvy?.name!} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};

export default function DivvyDetail() {
  return <ProtectedRoute><DivvyDetailContent /></ProtectedRoute>;
}
