
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
  
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [viewingSplits, setViewingSplits] = useState<ExpenseSplit[]>([]);

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
      const { data: divvyData, error: dErr } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
      if (dErr || !divvyData) {
         setLoading(false);
         return;
      }

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
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    members.forEach(m => balances[m.user_id] = 0);
    expenses.forEach(e => {
        if (balances[e.paid_by_user_id] !== undefined) balances[e.paid_by_user_id] += e.amount;
    });
    allSplits.forEach(s => {
        if (balances[s.participant_user_id] !== undefined) balances[s.participant_user_id] -= s.amount_owed;
    });
    settlements.filter(s => s.status === 'confirmed').forEach(s => {
      if (balances[s.payer_id] !== undefined) balances[s.payer_id] += s.amount;
      if (balances[s.receiver_id] !== undefined) balances[s.receiver_id] -= s.amount;
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

    const confirmedSettlements = settlements.filter(s => s.status === 'confirmed');
    const lastConfirmedDate = confirmedSettlements.length > 0 
      ? new Date(Math.max(...confirmedSettlements.map(s => new Date(s.created_at).getTime())))
      : null;

    const isGroupBalanced = plan.length === 0 && expenses.length > 0;

    return { plan, isGroupBalanced, lastConfirmedDate };
  }, [expenses, allSplits, members, settlements]);

  const isExpenseLocked = (exp: Expense) => {
    if (!calculateBalances.isGroupBalanced || !calculateBalances.lastConfirmedDate) return false;
    return new Date(exp.created_at) < calculateBalances.lastConfirmedDate;
  };

  const handleMarkAsPaid = async (to: string, amount: number) => {
    if (!confirm(`Confirmar que você enviou ${formatMoney(amount)} para ${getMemberName(to)}?`)) return;
    try {
      const { error } = await supabase.from('settlements').insert({
        divvy_id: divvyId, payer_id: user?.id, receiver_id: to, amount, status: 'pending'
      });
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: to, divvy_id: divvyId, type: 'settlement',
        title: 'Pagamento enviado', message: `${getMemberName(user?.id!)} informou que enviou o pagamento de ${formatMoney(amount)}.`
      });
      toast.success('Aviso enviado! O credor precisa confirmar o recebimento.');
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateSettlement = async (s: Settlement, status: 'confirmed' | 'rejected') => {
    const action = status === 'confirmed' ? 'confirmar' : 'recusar';
    if (!confirm(`Deseja ${action} este pagamento?`)) return;
    
    try {
      await supabase.from('settlements').update({ 
          status, 
          created_at: new Date().toISOString() 
      }).eq('id', s.id);
      
      await supabase.from('notifications').insert({
        user_id: s.payer_id, divvy_id: divvyId, type: 'settlement',
        title: status === 'confirmed' ? 'Pagamento confirmado!' : 'Pagamento recusado',
        message: `${getMemberName(s.receiver_id)} ${status === 'confirmed' ? 'confirmou' : 'não reconheceu'} o recebimento de ${formatMoney(s.amount)}.`
      });
      toast.success(`Pagamento ${status === 'confirmed' ? 'confirmado' : 'recusado'}.`);
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRequestPaymentInfo = async (to: string) => {
    try {
      await supabase.from('notifications').insert({
        user_id: to, divvy_id: divvyId, type: 'info',
        title: 'Pedido de dados PIX', message: `${getMemberName(user?.id!)} quer te pagar e solicitou seus dados de pagamento.`
      });
      toast.success('Solicitação enviada!');
    } catch (e: any) { toast.error(e.message); }
  };

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.user_id === uid);
    return m?.profiles?.nickname || m?.profiles?.full_name || m?.email.split('@')[0] || 'Membro';
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !divvy) return;
    setSubmitLoading(true);
    try {
      const val = parseFloat(amount);
      const { data: expense, error } = await supabase.from('expenses').insert({
        divvy_id: divvyId,
        paid_by_user_id: payerId || user.id,
        amount: val,
        category,
        description: desc,
        date: date
      }).select().single();

      if (error) throw error;

      const splitVal = val / members.length;
      const splits = members.map(m => ({
        expense_id: expense.id,
        participant_user_id: m.user_id,
        amount_owed: splitVal
      }));
      await supabase.from('expense_splits').insert(splits);

      toast.success('Despesa adicionada!');
      setIsExpenseModalOpen(false);
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitLoading(false); }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (!divvy) return <div className="p-12 text-center text-gray-500">Grupo não encontrado ou você não tem permissão para acessá-lo.</div>;

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy} onUpdate={fetchDivvyData} />

      {calculateBalances.isGroupBalanced && !divvy.is_archived && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-down shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Grupo Quitado!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Todos os saldos estão zerados. Deseja arquivar o grupo?</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => supabase.from('divvies').update({ is_archived: true }).eq('id', divvyId).then(() => router.push('/dashboard'))}>
            <Archive size={16} className="mr-2" /> Arquivar Agora
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus size={18} className="mr-2" /> Convidar</Button>
        <Button onClick={() => { setEditingExpenseId(null); setAmount(''); setIsExpenseModalOpen(true); }} disabled={divvy.is_archived}><Plus size={18} className="mr-2" /> Nova Despesa</Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex space-x-8">
          {[
            { id: 'expenses', label: 'Despesas', icon: Receipt },
            { id: 'balances', label: 'Balanços', icon: Wallet },
            { id: 'charts', label: 'Análise', icon: PieChart },
            { id: 'members', label: 'Membros', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? <EmptyState /> : expenses.map(exp => (
              <div key={exp.id} onClick={() => { setViewingExpense(exp); setIsViewModalOpen(true); }} className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl">{exp.category === 'food' ? '🍽️' : '💰'}</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {exp.description || exp.category}
                      {isExpenseLocked(exp) && <Lock size={12} className="text-gray-400" title="Despesa Quitada" />}
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
              <div key={s.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                   <Clock className="text-yellow-600" />
                   <p className="text-sm"><b>{getMemberName(s.payer_id)}</b> informou que te enviou <b>{formatMoney(s.amount)}</b>. Confirma o recebimento?</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={() => handleUpdateSettlement(s, 'rejected')}>Recusar</Button>
                  <Button size="sm" className="flex-1 bg-green-600 text-white" onClick={() => handleUpdateSettlement(s, 'confirmed')}>Confirmar</Button>
                </div>
              </div>
            ))}

            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Wallet size={20} className="text-brand-500" /> Como quitar as dívidas</h3>
              <div className="space-y-3">
                {calculateBalances.plan.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum saldo pendente.</div>
                ) : calculateBalances.plan.map((p, i) => {
                  const isMeDebtor = p.from === user?.id;
                  const hasSentPayment = settlements.some(s => s.payer_id === p.from && s.receiver_id === p.to && s.status === 'pending');
                  
                  return (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100 dark:border-dark-700">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{getMemberName(p.from)}</span>
                        <ArrowRight size={14} className="text-gray-400" />
                        <span className="font-semibold">{getMemberName(p.to)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-brand-600 dark:text-brand-400 text-lg">{formatMoney(p.amount)}</span>
                        {isMeDebtor && (
                          <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={() => handleRequestPaymentInfo(p.to)} title="Pedir chave PIX">
                                <Info size={16} />
                             </Button>
                             {hasSentPayment ? (
                                <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-3 py-2 rounded-lg">Pendente...</span>
                             ) : (
                                <Button size="sm" className="bg-green-600 text-white" onClick={() => handleMarkAsPaid(p.to, p.amount)}>Paguei</Button>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100">
             <ExpenseCharts expenses={expenses} />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(member => (
              <div key={member.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                    {member.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{getMemberName(member.user_id)}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-1 bg-gray-100 rounded">{member.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Despesa">
        {viewingExpense && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{viewingExpense.description || viewingExpense.category}</h3>
                <p className="text-sm text-gray-500">{new Date(viewingExpense.date).toLocaleDateString()} • {getMemberName(viewingExpense.paid_by_user_id)}</p>
              </div>
              <span className="text-2xl font-black text-brand-600">{formatMoney(viewingExpense.amount)}</span>
            </div>
            
            {isExpenseLocked(viewingExpense) && (
              <div className="bg-gray-100 dark:bg-dark-700 p-3 rounded-xl flex items-center gap-3 text-sm text-gray-500">
                <Lock size={16}/> Esta despesa já foi quitada e está bloqueada para edição.
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button fullWidth variant="outline" disabled={isExpenseLocked(viewingExpense) || divvy.is_archived}>Editar</Button>
              <Button fullWidth variant="outline" className="text-red-600" disabled={isExpenseLocked(viewingExpense) || divvy.is_archived}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Nova Despesa">
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <Input label="Valor (R$)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
             <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} />
             <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-dark-800" value={category} onChange={e => setCategory(e.target.value)}>
                   <option value="food">🍽️ Alimentação</option>
                   <option value="transport">🚗 Transporte</option>
                   <option value="activity">🎬 Atividade</option>
                   <option value="other">💰 Outros</option>
                </select>
             </div>
          </div>
          <Input label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Almoço no shopping" />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={submitLoading}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <InviteModal divvyId={divvyId} divvyName={divvy.name} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};

export default function DivvyDetail() {
  return <ProtectedRoute><DivvyDetailContent /></ProtectedRoute>;
}
