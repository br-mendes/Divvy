import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Plus, UserPlus, Receipt, PieChart, Users, Lock, LockOpen, 
  ArrowRight, Wallet, CheckCircle, Clock, Archive, LucideIcon
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

  // --- Estado do Formulário de Despesa ---
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});
  const [manualPercentages, setManualPercentages] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Memoized fetch logic for reuse
  const fetchDivvyData = useCallback(async () => {
    if (!divvyId || !user) return;
    
    try {
      // 1. Detalhes do Grupo
      const { data: divvyData, error: dErr } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
      if (dErr || !divvyData) { 
        console.error("Group fetch error:", dErr);
        setLoading(false); 
        return; 
      }
      setDivvy(divvyData);

      // 2. Membros e Perfis com Query Única (Inner Join)
      // Se profiles vier nulo, o RLS está bloqueando ou a FK não existe.
      const { data: membersData, error: mErr } = await supabase
        .from('divvy_members')
        .select('*, profiles:user_id(*)')
        .eq('divvy_id', divvyId);

      if (mErr) throw mErr;
      
      const processedMembers = (membersData || []).map(m => ({
        ...m,
        // Garante que o objeto profiles não seja um array de um elemento (comum em algumas configs de JS SDK)
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      }));

      setMembers(processedMembers);

      // 3. Despesas e Acertos
      const [expensesRes, settlementsRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('divvy_id', divvyId).order('date', { ascending: false }),
        supabase.from('settlements').select('*').eq('divvy_id', divvyId).order('created_at', { ascending: false })
      ]);

      setExpenses(expensesRes.data || []);
      setSettlements(settlementsRes.data || []);

      if (expensesRes.data && expensesRes.data.length > 0) {
        const { data: splitData } = await supabase.from('expense_splits').select('*').in('expense_id', expensesRes.data.map(e => e.id));
        setAllSplits(splitData || []);
      }
    } catch (error) { 
        console.error("Erro geral no fetch:", error); 
        toast.error("Erro ao sincronizar dados.");
    } finally { 
        setLoading(false); 
    }
  }, [divvyId, user]);

  useEffect(() => {
    fetchDivvyData();
  }, [fetchDivvyData]);

  // Sincroniza formulário sempre que membros carregarem ou modal abrir
  useEffect(() => {
    if (isExpenseModalOpen && members.length > 0 && user) {
        // Se payerId vazio, define usuário atual
        if (!payerId) {
            const me = members.find(m => m.user_id === user.id);
            if (me) setPayerId(me.user_id);
            else setPayerId(members[0].user_id);
        }
        
        // Seleciona todos por padrão para a divisão igual
        if (selectedParticipants.size === 0) {
            setSelectedParticipants(new Set(members.map(m => m.user_id)));
        }
    }
  }, [isExpenseModalOpen, members, user, payerId, selectedParticipants.size]);

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.user_id === uid);
    if (!m) return 'Membro';
    const p: any = m.profiles;
    return p?.nickname || p?.full_name || m.email?.split('@')[0] || 'Participante';
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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

    const hasPendingSettlements = settlements.some(s => s.status === 'pending');
    return { plan, isGroupBalanced: expenses.length > 0 && plan.length === 0 && !hasPendingSettlements };
  }, [expenses, allSplits, members, settlements]);

  const isBlocked = (exp: Expense) => {
    if (!divvy?.last_settled_at) return false;
    return new Date(exp.created_at).getTime() < new Date(divvy.last_settled_at).getTime() && !exp.is_manually_unlocked;
  };

  const handleUpdateSettlement = async (s: Settlement, status: 'confirmed' | 'rejected') => {
    if (!confirm(`Deseja ${status === 'confirmed' ? 'confirmar' : 'recusar'} o recebimento?`)) return;
    try {
      await supabase.from('settlements').update({ status }).eq('id', s.id);
      await supabase.from('notifications').insert({
        user_id: s.payer_id, divvy_id: divvyId, type: 'settlement',
        title: status === 'confirmed' ? 'Pagamento confirmado!' : 'Pagamento recusado',
        message: `${getMemberName(s.receiver_id)} ${status === 'confirmed' ? 'confirmou' : 'recusou'} seu pagamento de ${formatMoney(s.amount)}.`
      });
      fetchDivvyData();
      toast.success('Status atualizado.');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkAsPaid = async (to: string, amount: number) => {
    if (!confirm(`Informar que pagou ${formatMoney(amount)} para ${getMemberName(to)}?`)) return;
    try {
      await supabase.from('settlements').insert({
        divvy_id: divvyId, payer_id: user?.id, receiver_id: to, amount, status: 'pending'
      });
      await supabase.from('notifications').insert({
        user_id: to, divvy_id: divvyId, type: 'settlement',
        title: 'Pagamento enviado', 
        message: `${getMemberName(user?.id!)} informou que enviou ${formatMoney(amount)}.`
      });
      toast.success('Aviso enviado!');
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !divvy) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !desc.trim() || !payerId) {
        toast.error("Preencha todos os campos corretamente.");
        return;
    }

    let splitsPayload: { participant_user_id: string; amount_owed: number; }[] = [];

    if (splitType === 'equal') {
        if (selectedParticipants.size === 0) return;
        const splitVal = val / selectedParticipants.size;
        // Fix for Type '{ participant_user_id: unknown; amount_owed: number; }[]' is not assignable error by adding explicit type to uid
        splitsPayload = Array.from(selectedParticipants).map((uid: string) => ({ participant_user_id: uid, amount_owed: splitVal }));
    } else if (splitType === 'exact') {
        let sum = 0;
        splitsPayload = members.map(m => {
            const v = parseFloat(manualAmounts[m.user_id] || '0');
            sum += v;
            return { participant_user_id: m.user_id, amount_owed: v };
        }).filter(s => s.amount_owed > 0);
        if (Math.abs(sum - val) > 0.05) { toast.error("A soma deve ser igual ao total."); return; }
    } else if (splitType === 'percentage') {
        let totalPct = 0;
        splitsPayload = members.map(m => {
            const pct = parseFloat(manualPercentages[m.user_id] || '0');
            totalPct += pct;
            return { participant_user_id: m.user_id, amount_owed: (val * pct) / 100 };
        }).filter(s => s.amount_owed > 0);
        if (Math.abs(totalPct - 100) > 0.5) { toast.error("A soma das % deve ser 100."); return; }
    }

    setSubmitLoading(true);
    try {
      const { data: exp, error } = await supabase.from('expenses').insert({
        divvy_id: divvyId, paid_by_user_id: payerId, amount: val, category, description: desc, date
      }).select().single();
      if (error) throw error;
      await supabase.from('expense_splits').insert(splitsPayload.map(s => ({ ...s, expense_id: exp.id })));
      toast.success('Despesa salva!');
      setIsExpenseModalOpen(false);
      setAmount(''); setDesc(''); setManualAmounts({}); setManualPercentages({});
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitLoading(false); }
  };

  if (loading) return <div className="flex justify-center p-20"><LoadingSpinner /></div>;
  if (!divvy) return <EmptyState message="Grupo não acessível" />;

  const tabs: { id: any, label: string, icon: LucideIcon }[] = [
    { id: 'expenses', label: 'Despesas', icon: Receipt },
    { id: 'balances', label: 'Saldos', icon: Wallet },
    { id: 'charts', label: 'Análise', icon: PieChart },
    { id: 'members', label: 'Membros', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy} onUpdate={fetchDivvyData} />

      {calculateBalances.isGroupBalanced && !divvy.is_archived && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-down shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg"><CheckCircle size={24} /></div>
            <div>
              <h3 className="font-bold">Dívidas Quitadas! 🎉</h3>
              <p className="text-sm text-gray-500">Tudo em dia. Deseja arquivar o grupo?</p>
            </div>
          </div>
          <Button size="sm" className="bg-brand-600" onClick={() => supabase.from('divvies').update({ is_archived: true }).eq('id', divvyId).then(() => router.push('/dashboard'))}>Arquivar</Button>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus size={18} className="mr-2" /> Convidar</Button>
        <Button onClick={() => setIsExpenseModalOpen(true)} disabled={divvy.is_archived}><Plus size={18} className="mr-2" /> Nova Despesa</Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
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
            {expenses.length === 0 ? <EmptyState message="Sem despesas ainda" /> : expenses.map(exp => (
              <div key={exp.id} onClick={() => { setViewingExpense(exp); setIsViewModalOpen(true); }} className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl">
                    {exp.category === 'food' ? '🍽️' : exp.category === 'transport' ? '🚗' : '💰'}
                  </div>
                  <div>
                    <p className="font-bold">{exp.description || exp.category} {isBlocked(exp) && <Lock size={12} className="inline text-gray-400" />}</p>
                    <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {getMemberName(exp.paid_by_user_id)}</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatMoney(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            {settlements.filter(s => s.status === 'pending' && s.receiver_id === user?.id).map(s => (
              <div key={s.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-yellow-500">
                <p className="text-sm"><b>{getMemberName(s.payer_id)}</b> informou que te pagou <b>{formatMoney(s.amount)}</b>.</p>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateSettlement(s, 'rejected')}>Recusar</Button>
                  <Button size="sm" className="bg-green-600 text-white" onClick={() => handleUpdateSettlement(s, 'confirmed')}>Confirmar</Button>
                </div>
              </div>
            ))}
            <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm">
              <h3 className="font-bold mb-6 flex items-center gap-2"><Wallet size={20} className="text-brand-500" /> Acertos Sugeridos</h3>
              <div className="space-y-3">
                {calculateBalances.plan.length === 0 ? <p className="text-gray-500 text-center py-10">Tudo em dia!</p> : calculateBalances.plan.map((p, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-dark-800/50 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{getMemberName(p.from)}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className="font-semibold">{getMemberName(p.to)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-brand-600 text-lg">{formatMoney(p.amount)}</span>
                      {p.from === user?.id && !settlements.some(s => s.payer_id === p.from && s.receiver_id === p.to && s.status === 'pending') && (
                        <Button size="sm" className="bg-green-600 text-white" onClick={() => handleMarkAsPaid(p.to, p.amount)}>Paguei</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'charts' && <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800"><ExpenseCharts expenses={expenses} /></div>}
        
        {activeTab === 'members' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {members.map(member => (
               <div key={member.id} className="bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center font-bold">{(member.profiles?.full_name || member.email || '?').charAt(0).toUpperCase()}</div>
                   <div><p className="font-bold">{getMemberName(member.user_id)}</p><p className="text-xs text-gray-500">{member.email}</p></div>
                 </div>
                 <span className="text-[10px] uppercase font-black px-2 py-1 bg-gray-100 dark:bg-dark-800 rounded">{member.role}</span>
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
            {isBlocked(viewingExpense) && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded">Bloqueada após acerto.</p>}
            <div className="flex gap-3 pt-4">
              <Button fullWidth variant="outline" disabled={divvy.is_archived || isBlocked(viewingExpense)}>Editar</Button>
              <Button fullWidth variant="outline" className="text-red-600" disabled={divvy.is_archived || isBlocked(viewingExpense)}>Excluir</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Nova Despesa" size="lg">
        <form onSubmit={handleSaveExpense} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2"><Input label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que foi comprado?" required /></div>
             <Input label="Valor (R$)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
             <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} />
             <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-dark-800" value={category} onChange={e => setCategory(e.target.value)}>
                   <option value="food">🍽️ Alimentação</option>
                   <option value="transport">🚗 Transporte</option>
                   <option value="activity">🎬 Atividade</option>
                   <option value="utilities">💡 Contas</option>
                   <option value="shopping">🛍️ Compras</option>
                   <option value="other">💰 Outros</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium mb-1">Quem pagou?</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-dark-800" value={payerId} onChange={e => setPayerId(e.target.value)}>
                   {members.map(m => <option key={m.user_id} value={m.user_id}>{m.user_id === user?.id ? 'Eu' : getMemberName(m.user_id)}</option>)}
                </select>
             </div>
          </div>

          <div className="border-t pt-4">
             <label className="block text-sm font-bold mb-3">Como dividir?</label>
             <div className="flex gap-2 mb-4 bg-gray-50 dark:bg-dark-800 p-1 rounded-lg w-fit">
                {['equal', 'exact', 'percentage'].map(t => (
                  <button key={t} type="button" onClick={() => setSplitType(t as any)} className={`px-4 py-1.5 rounded-md text-sm font-medium ${splitType === t ? 'bg-white dark:bg-dark-900 shadow text-brand-600' : 'text-gray-500'}`}>{t === 'equal' ? 'Igual' : t === 'exact' ? 'Valor' : '%'}</button>
                ))}
             </div>
             <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-dark-800 rounded-xl">
                 {members.map(m => (
                     <div key={m.user_id} className="flex items-center justify-between p-2">
                         <div className="flex items-center gap-3">
                             {splitType === 'equal' && <input type="checkbox" checked={selectedParticipants.has(m.user_id)} onChange={() => { const s = new Set(selectedParticipants); s.has(m.user_id) ? s.delete(m.user_id) : s.add(m.user_id); setSelectedParticipants(s); }} className="w-5 h-5 rounded text-brand-600" />}
                             <span className="text-sm font-medium">{getMemberName(m.user_id)}</span>
                         </div>
                         {splitType === 'equal' && <span className="text-xs">{selectedParticipants.has(m.user_id) ? formatMoney(parseFloat(amount || '0') / selectedParticipants.size) : '-'}</span>}
                         {splitType === 'exact' && <input type="number" step="0.01" value={manualAmounts[m.user_id] || ''} onChange={e => setManualAmounts({ ...manualAmounts, [m.user_id]: e.target.value })} className="w-20 p-1 border rounded text-right text-sm" placeholder="0.00" />}
                         {splitType === 'percentage' && <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{formatMoney((parseFloat(amount || '0') * (parseFloat(manualPercentages[m.user_id] || '0'))) / 100)}</span><input type="number" value={manualPercentages[m.user_id] || ''} onChange={e => setManualPercentages({ ...manualPercentages, [m.user_id]: e.target.value })} className="w-16 p-1 border rounded text-right text-sm" placeholder="0%" /></div>}
                     </div>
                 ))}
             </div>
          </div>

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

export default function DivvyDetail() { return <ProtectedRoute><DivvyDetailContent /></ProtectedRoute>; }
