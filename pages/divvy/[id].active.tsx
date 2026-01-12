
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense, ExpenseSplit, Settlement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ExpenseCharts } from '../../components/Charts';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import InviteModal from '../../components/invite/InviteModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { 
  Plus, UserPlus, Receipt, PieChart, Users, CreditCard, Lock, LockOpen, 
  ArrowRight, Wallet, CheckCircle, Info, Archive, Clock, AlertCircle
} from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

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

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (divvyId && user) fetchDivvyData();
  }, [divvyId, user]);

  const fetchDivvyData = async () => {
    try {
      const { data: divvyData, error: dErr } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
      if (dErr || !divvyData) { setLoading(false); return; }

      const [membersRes, expensesRes, settlementsRes] = await Promise.all([
        supabase.from('divvy_members').select('*, profiles(*)').eq('divvy_id', divvyId),
        supabase.from('expenses').select('*').eq('divvy_id', divvyId).order('date', { ascending: false }),
        supabase.from('settlements').select('*').eq('divvy_id', divvyId).order('created_at', { ascending: false })
      ]);

      setDivvy(divvyData);
      setMembers(membersRes.data || []);
      setExpenses(expensesRes.data || []);
      setSettlements(settlementsRes.data || []);

      if (expensesRes.data && expensesRes.data.length > 0) {
        const { data: splitData } = await supabase.from('expense_splits').select('*').in('expense_id', expensesRes.data.map(e => e.id));
        setAllSplits(splitData || []);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const calculateBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    members.forEach(m => balances[m.user_id] = 0);

    expenses.forEach(e => { if (balances[e.paid_by_user_id] !== undefined) balances[e.paid_by_user_id] += e.amount; });
    allSplits.forEach(s => { if (balances[s.participant_user_id] !== undefined) balances[s.participant_user_id] -= s.amount_owed; });
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
      if (amount > 0.01) plan.push({ from: debtors[i].id, to: creditors[j].id, amount });
      debtors[i].b -= amount; creditors[j].b -= amount;
      if (debtors[i].b < 0.01) i++;
      if (creditors[j].b < 0.01) j++;
    }

    // Regra Global: Sugestão de arquivamento apenas se saldo zero E sem pendências
    const hasPendingSettlements = settlements.some(s => s.status === 'pending');
    const isGroupBalanced = expenses.length > 0 && plan.length === 0 && !hasPendingSettlements;

    return { plan, isGroupBalanced };
  }, [expenses, allSplits, members, settlements]);

  // Regra 2: Bloqueio de despesas anteriores ao último fechamento
  const isBlocked = (exp: Expense) => {
    if (!divvy?.last_settled_at) return false;
    const settledTime = new Date(divvy.last_settled_at).getTime();
    const expenseTime = new Date(exp.created_at).getTime();
    return expenseTime < settledTime && !exp.is_manually_unlocked;
  };

  const handleUpdateSettlement = async (s: Settlement, status: 'confirmed' | 'rejected') => {
    const action = status === 'confirmed' ? 'confirmar' : 'recusar';
    if (!confirm(`Deseja ${action} este pagamento?`)) return;
    
    try {
      const { error } = await supabase.from('settlements').update({ status }).eq('id', s.id);
      if (error) throw error;
      
      // Notifica o pagador
      await supabase.from('notifications').insert({
        user_id: s.payer_id, 
        divvy_id: divvyId, 
        type: 'settlement',
        title: status === 'confirmed' ? 'Pagamento confirmado!' : 'Pagamento recusado',
        message: `${getMemberName(s.receiver_id)} ${status === 'confirmed' ? 'confirmou' : 'recusou'} o recebimento de ${formatMoney(s.amount)}.`
      });

      // Se for a última confirmação que zera o grupo, marca o timestamp de bloqueio
      const updatedSettlements = settlements.map(item => item.id === s.id ? {...item, status} : item);
      const tempBalances = calculateBalancesWithSettlements(updatedSettlements);
      
      if (status === 'confirmed' && tempBalances.plan.length === 0 && !updatedSettlements.some(item => item.status === 'pending')) {
          await supabase.from('divvies').update({ last_settled_at: new Date().toISOString() }).eq('id', divvyId);
          toast.success('Grupo totalmente quitado! As despesas foram bloqueadas.');
      }

      toast.success(`Pagamento ${status === 'confirmed' ? 'confirmado' : 'recusado'}.`);
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  // Helper para simular balanço antes do state update
  const calculateBalancesWithSettlements = (currentSettlements: Settlement[]) => {
      const balances: Record<string, number> = {};
      members.forEach(m => balances[m.user_id] = 0);
      expenses.forEach(e => { if (balances[e.paid_by_user_id] !== undefined) balances[e.paid_by_user_id] += e.amount; });
      allSplits.forEach(s => { if (balances[s.participant_user_id] !== undefined) balances[s.participant_user_id] -= s.amount_owed; });
      currentSettlements.filter(s => s.status === 'confirmed').forEach(s => {
        if (balances[s.payer_id] !== undefined) balances[s.payer_id] += s.amount;
        if (balances[s.receiver_id] !== undefined) balances[s.receiver_id] -= s.amount;
      });
      const plan: any[] = [];
      const debtors = Object.entries(balances).filter(([_, b]) => b < -0.01).map(([id, b]) => ({ id, b: Math.abs(b) }));
      const creditors = Object.entries(balances).filter(([_, b]) => b > 0.01).map(([id, b]) => ({ id, b }));
      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i].b, creditors[j].b);
        if (amount > 0.01) plan.push({ from: debtors[i].id, to: creditors[j].id, amount });
        debtors[i].b -= amount; creditors[j].b -= amount;
        if (debtors[i].b < 0.01) i++;
        if (creditors[j].b < 0.01) j++;
      }
      return { plan };
  };

  const handleUnlockExpense = async (exp: Expense) => {
    if (!user || user.id !== divvy?.creator_id) return;
    if (!confirm('Deseja desbloquear esta despesa manualmente? Todos os membros serão notificados.')) return;

    try {
        await supabase.from('expenses').update({ is_manually_unlocked: true }).eq('id', exp.id);
        await supabase.from('notifications').insert(
            members.map(m => ({
                user_id: m.user_id,
                divvy_id: divvyId,
                type: 'info',
                title: 'Despesa desbloqueada',
                message: `O criador do grupo desbloqueou a despesa "${exp.description || exp.category}" para edição.`
            }))
        );
        toast.success('Despesa desbloqueada para edição.');
        fetchDivvyData();
        setIsViewModalOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkAsPaid = async (to: string, amount: number) => {
    if (!confirm(`Confirmar que você enviou ${formatMoney(amount)} para ${getMemberName(to)}?`)) return;
    try {
      const { error } = await supabase.from('settlements').insert({
        divvy_id: divvyId, payer_id: user?.id, receiver_id: to, amount, status: 'pending'
      });
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: to, 
        divvy_id: divvyId, 
        type: 'settlement',
        title: 'Pagamento enviado', 
        message: `${getMemberName(user?.id!)} informou que enviou o pagamento de ${formatMoney(amount)}.`
      });
      toast.success('Aviso enviado! Aguarde a confirmação do credor.');
      fetchDivvyData();
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
        divvy_id: divvyId, paid_by_user_id: user.id, amount: val, category, description: desc, date: date
      }).select().single();
      if (error) throw error;
      const splitVal = val / members.length;
      await supabase.from('expense_splits').insert(members.map(m => ({ expense_id: expense.id, participant_user_id: m.user_id, amount_owed: splitVal })));
      toast.success('Despesa adicionada!');
      setIsExpenseModalOpen(false);
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitLoading(false); }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (!divvy) return <div className="p-12 text-center text-gray-500">Grupo não encontrado.</div>;

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy} onUpdate={fetchDivvyData} />

      {/* Regra 2.1: Banner de Sugestão de Arquivamento */}
      {calculateBalances.isGroupBalanced && !divvy.is_archived && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-down shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Dívidas Quitadas! 🎉</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Todos os saldos foram confirmados. Deseja arquivar o grupo agora?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast('A sugestão sumirá ao adicionar novas despesas.', { icon: 'ℹ️' })}>Não agora</Button>
            <Button size="sm" className="bg-brand-600" onClick={() => supabase.from('divvies').update({ is_archived: true }).eq('id', divvyId).then(() => router.push('/dashboard'))}>
              <Archive size={16} className="mr-2" /> Arquivar Grupo
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus size={18} className="mr-2" /> Convidar</Button>
        <Button onClick={() => { setAmount(''); setIsExpenseModalOpen(true); }} disabled={divvy.is_archived}><Plus size={18} className="mr-2" /> Nova Despesa</Button>
      </div>

      {/* Tabs */}
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
                activeTab === tab.id ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500'
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
                  <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl">
                    {exp.category === 'food' ? '🍽️' : exp.category === 'transport' ? '🚗' : '💰'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-white">{exp.description || exp.category}</p>
                        {isBlocked(exp) && <Lock size={12} className="text-gray-400" title="Despesa Bloqueada" />}
                    </div>
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
            {/* Solicitações de Confirmação Pendentes */}
            {settlements.filter(s => s.status === 'pending' && s.receiver_id === user?.id).map(s => (
              <div key={s.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-yellow-500">
                <div className="flex items-center gap-3">
                   <Clock className="text-yellow-600" />
                   <p className="text-sm"><b>{getMemberName(s.payer_id)}</b> informou que te pagou <b>{formatMoney(s.amount)}</b>.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200" onClick={() => handleUpdateSettlement(s, 'rejected')}>Recusar</Button>
                  <Button size="sm" className="flex-1 bg-green-600 text-white" onClick={() => handleUpdateSettlement(s, 'confirmed')}>Confirmar</Button>
                </div>
              </div>
            ))}

            <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Wallet size={20} className="text-brand-500" /> Como quitar as dívidas</h3>
              <div className="space-y-3">
                {calculateBalances.plan.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-dark-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-dark-700">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                    <p className="text-gray-500 font-medium">Tudo em dia!</p>
                  </div>
                ) : (
                  calculateBalances.plan.map((p, i) => {
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
                               {hasSentPayment ? (
                                  <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-3 py-2 rounded-lg border border-yellow-200">Aguardando...</span>
                               ) : (
                                  <Button size="sm" className="bg-green-600 text-white" onClick={() => handleMarkAsPaid(p.to, p.amount)}>Paguei</Button>
                               )}
                             </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
        {/* Outras abas omitidas para brevidade, mas mantidas no arquivo original */}
        {activeTab === 'charts' && <div className="bg-white dark:bg-dark-800 p-6 rounded-2xl border border-gray-100"><ExpenseCharts expenses={expenses} /></div>}
        {activeTab === 'members' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {members.map(member => (
               <div key={member.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold">{member.email.charAt(0).toUpperCase()}</div>
                   <div>
                     <p className="font-bold">{getMemberName(member.user_id)}</p>
                     <p className="text-xs text-gray-500">{member.email}</p>
                   </div>
                 </div>
                 <span className="text-[10px] uppercase font-black px-2 py-1 bg-gray-100 rounded">{member.role}</span>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* Modal Detalhes com Regra de Bloqueio */}
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
            
            {isBlocked(viewingExpense) ? (
              <div className="bg-gray-100 dark:bg-dark-700 p-4 rounded-2xl flex flex-col gap-3 border border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Lock size={18} className="text-red-400"/> 
                  <p>Esta despesa foi <b>bloqueada</b> automaticamente após o fechamento do balanço do grupo.</p>
                </div>
                {user?.id === divvy?.creator_id && (
                    <Button variant="outline" size="sm" onClick={() => handleUnlockExpense(viewingExpense)}>
                        <LockOpen size={14} className="mr-2" /> Desbloquear Despesa (Criador)
                    </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-3 pt-4">
                <Button fullWidth variant="outline" disabled={divvy.is_archived}>Editar</Button>
                <Button fullWidth variant="outline" className="text-red-600" disabled={divvy.is_archived}>Excluir</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Outros Modais mantidos... */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Nova Despesa">
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <Input label="Valor (R$)" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Almoço no shopping" />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={submitLoading}>Salvar</Button>
          </div>
        </form>
      </Modal>
      <InviteModal divvyId={divvyId} divvyName={divvy?.name || ''} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};

export default function DivvyDetail() {
  return <ProtectedRoute><DivvyDetailContent /></ProtectedRoute>;
}
