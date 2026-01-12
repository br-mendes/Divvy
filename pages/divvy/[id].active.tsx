
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense, ExpenseSplit, Transaction } from '../../types';
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
  ArrowRight, Wallet, CheckCircle, Clock, Archive, LucideIcon, AlertTriangle
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  // Fetch Logic
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

      // 2. Membros e Perfis
      const { data: membersData, error: mErr } = await supabase
        .from('divvymembers')
        .select(`
            *,
            userprofiles:userid (*)
        `)
        .eq('divvyid', divvyId);

      if (mErr) throw mErr;
      
      const processedMembers: DivvyMember[] = (membersData || []).map((m: any) => ({
        id: m.id,
        divvyid: m.divvyid,
        userid: m.userid,
        email: m.email,
        role: m.role,
        joinedat: m.joinedat,
        userprofiles: Array.isArray(m.userprofiles) ? m.userprofiles[0] : m.userprofiles
      }));

      setMembers(processedMembers);

      // 3. Despesas e Transações
      const [expensesRes, transactionsRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('divvyid', divvyId).order('date', { ascending: false }),
        supabase.from('transactions').select('*').eq('divvyid', divvyId).order('createdat', { ascending: false })
      ]);

      setExpenses(expensesRes.data || []);
      setTransactions(transactionsRes.data || []);

      if (expensesRes.data && expensesRes.data.length > 0) {
        const { data: splitData } = await supabase.from('expensesplits').select('*').in('expenseid', expensesRes.data.map(e => e.id));
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

  useEffect(() => {
    if (isExpenseModalOpen && members.length > 0 && user) {
        if (!payerId) {
            const me = members.find(m => m.userid === user.id);
            if (me) setPayerId(me.userid);
            else setPayerId(members[0].userid);
        }
        if (selectedParticipants.size === 0) {
            setSelectedParticipants(new Set(members.map(m => m.userid)));
        }
    }
  }, [isExpenseModalOpen, members, user, payerId, selectedParticipants.size]);

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.userid === uid);
    if (!m) return 'Membro';
    const p = m.userprofiles;
    return p?.displayname || p?.fullname || m.email?.split('@')[0] || 'Participante';
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const calculateBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    members.forEach(m => balances[m.userid] = 0);

    // Soma despesas pagas (+ crédito)
    expenses.forEach(e => { 
        if (balances[e.paidbyuserid] !== undefined) balances[e.paidbyuserid] += e.amount; 
    });
    
    // Subtrai splits devidos (- débito)
    allSplits.forEach(s => { 
        if (balances[s.participantuserid] !== undefined) balances[s.participantuserid] -= s.amountowed; 
    });
    
    // Processa transações (pagamentos feitos reduzem dívida)
    transactions.filter(t => t.status === 'confirmed').forEach(t => {
      if (balances[t.fromuserid] !== undefined) balances[t.fromuserid] += t.amount;
      if (balances[t.touserid] !== undefined) balances[t.touserid] -= t.amount;
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

    const hasPendingTransactions = transactions.some(t => t.status === 'pending' || t.status === 'paymentsent');
    
    return { plan, isGroupBalanced: expenses.length > 0 && plan.length === 0 && !hasPendingTransactions };
  }, [expenses, allSplits, members, transactions]);

  const isLocked = (exp: Expense) => {
    return exp.locked;
  };

  // --- FLUXO DE PAGAMENTO ---
  const handleUpdateTransaction = async (t: Transaction, action: 'confirm' | 'reject') => {
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    
    if (!confirm(`Deseja ${action === 'confirm' ? 'confirmar' : 'rejeitar'} este pagamento?`)) return;
    
    try {
      // 1. Atualizar a transação atual
      const updatePayload: any = { 
          status: newStatus,
          updatedat: new Date().toISOString()
      };
      
      if (newStatus === 'confirmed') {
          updatePayload.paidat = new Date().toISOString();
      }

      const { error } = await supabase.from('transactions').update(updatePayload).eq('id', t.id);
      if (error) throw error;

      // 2. Se confirmado, verificar regra global de bloqueio
      if (newStatus === 'confirmed') {
          // Busca todas as transações para ver se estão confirmadas ou rejeitadas
          const { data: allTxs } = await supabase
            .from('transactions')
            .select('status, paidat')
            .eq('divvyid', divvyId);

          const allConfirmed = allTxs?.every(tx => {
              // A transação atual ainda pode aparecer como pendente na leitura se o write não propagou imediatamente
              // Mas assumimos que ela está confirmada.
              if (tx.id === t.id) return true; 
              return tx.status === 'confirmed' || tx.status === 'rejected';
          });

          // Se todas estiverem resolvidas, bloqueamos despesas até a data do último pagamento
          if (allConfirmed && allTxs) {
              // Pega a data mais recente de pagamento (incluindo a atual)
              const dates = allTxs
                .filter(tx => tx.status === 'confirmed' || (tx.id === t.id)) // Se a atual é confirmed
                .map(tx => tx.id === t.id ? new Date() : new Date(tx.paidat || 0));
              
              if (dates.length > 0) {
                  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                  
                  // Atualiza o grupo
                  await supabase.from('divvies').update({
                      lastglobalconfirmationat: maxDate.toISOString(),
                      archivesuggested: true,
                      archivesuggestedat: new Date().toISOString()
                  }).eq('id', divvyId);

                  // Bloqueia despesas anteriores ou iguais a data
                  await supabase.from('expenses')
                    .update({
                        locked: true,
                        lockedreason: 'Bloqueada automaticamente - todas as dívidas confirmadas',
                        lockedat: new Date().toISOString()
                    })
                    .eq('divvyid', divvyId)
                    .lte('date', maxDate.toISOString())
                    .eq('locked', false);
              }
          }
      }

      fetchDivvyData();
      toast.success(`Pagamento ${newStatus === 'confirmed' ? 'confirmado' : 'rejeitado'}.`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkAsSent = async (to: string, amount: number) => {
    if (!confirm(`Confirmar que você enviou ${formatMoney(amount)} para ${getMemberName(to)}?`)) return;
    try {
      const { error } = await supabase.from('transactions').insert({
        divvyid: divvyId, 
        fromuserid: user?.id, 
        touserid: to, 
        amount, 
        status: 'paymentsent', // Já nasce como enviado
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      });

      if (error) throw error;
      
      toast.success('Pagamento registrado! Aguarde confirmação.');
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUnlockExpense = async (exp: Expense) => {
      // Regra: Apenas criador desbloqueia
      if (user?.id !== divvy?.creatorid) return;
      if (!confirm("Desbloquear despesa manualmente?")) return;

      try {
          const { error } = await supabase.from('expenses').update({
              locked: false,
              lockedreason: null,
              lockedat: null
          }).eq('id', exp.id);
          
          if(error) throw error;
          toast.success("Despesa desbloqueada.");
          setIsViewModalOpen(false);
          fetchDivvyData();
      } catch(e: any) { toast.error(e.message); }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !divvy) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !desc.trim() || !payerId) {
        toast.error("Preencha todos os campos corretamente.");
        return;
    }

    let splitsPayload: { participantuserid: string; amountowed: number; }[] = [];

    if (splitType === 'equal') {
        if (selectedParticipants.size === 0) return;
        const splitVal = val / selectedParticipants.size;
        splitsPayload = Array.from(selectedParticipants).map((uid: string) => ({ participantuserid: uid, amountowed: splitVal }));
    } else if (splitType === 'exact') {
        let sum = 0;
        splitsPayload = members.map(m => {
            const v = parseFloat(manualAmounts[m.userid] || '0');
            sum += v;
            return { participantuserid: m.userid, amountowed: v };
        }).filter(s => s.amountowed > 0);
        if (Math.abs(sum - val) > 0.05) { toast.error("A soma deve ser igual ao total."); return; }
    } else if (splitType === 'percentage') {
        let totalPct = 0;
        splitsPayload = members.map(m => {
            const pct = parseFloat(manualPercentages[m.userid] || '0');
            totalPct += pct;
            return { participantuserid: m.userid, amountowed: (val * pct) / 100 };
        }).filter(s => s.amountowed > 0);
        if (Math.abs(totalPct - 100) > 0.5) { toast.error("A soma das % deve ser 100."); return; }
    }

    setSubmitLoading(true);
    try {
      const { data: exp, error } = await supabase.from('expenses').insert({
        divvyid: divvyId, 
        paidbyuserid: payerId, 
        amount: val, 
        category, 
        description: desc, 
        date,
        locked: false // Default
      }).select().single();

      if (error) throw error;
      await supabase.from('expensesplits').insert(splitsPayload.map(s => ({ ...s, expenseid: exp.id })));
      toast.success('Despesa salva!');
      setIsExpenseModalOpen(false);
      setAmount(''); setDesc(''); setManualAmounts({}); setManualPercentages({});
      fetchDivvyData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitLoading(false); }
  };

  const handleArchiveGroup = async () => {
      if(!divvy) return;
      try {
          await supabase.from('divvies').update({ isarchived: true, endedat: new Date().toISOString(), archivesuggested: false }).eq('id', divvy.id);
          toast.success("Grupo arquivado.");
          fetchDivvyData();
      } catch(e) { toast.error("Erro ao arquivar"); }
  };

  const handleDismissArchive = async () => {
    if (!divvy) return;
    try {
        await supabase.from('divvies').update({ archivesuggested: false }).eq('id', divvy.id);
        toast.success("Sugestão ocultada.");
        fetchDivvyData();
    } catch(e) { toast.error("Erro ao ocultar"); }
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

      {/* Sugestão de Arquivamento (Regra de Negócio) */}
      {(divvy.archivesuggested && !divvy.isarchived) && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center animate-fade-in-down gap-4">
            <div className="flex items-center gap-3">
                <Archive className="text-blue-600" />
                <div>
                    <p className="font-bold text-blue-900">Todas as contas foram acertadas!</p>
                    <p className="text-sm text-blue-700">Deseja arquivar este grupo?</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={handleDismissArchive}>Não agora</Button>
                <Button size="sm" onClick={handleArchiveGroup}>Arquivar Agora</Button>
            </div>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus size={18} className="mr-2" /> Convidar</Button>
        <Button onClick={() => setIsExpenseModalOpen(true)} disabled={divvy.isarchived}><Plus size={18} className="mr-2" /> Nova Despesa</Button>
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
                    <p className="font-bold flex items-center gap-2">
                        {exp.description || exp.category} 
                        {isLocked(exp) && <span title="Bloqueado"><Lock size={14} className="text-red-500" /></span>}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {getMemberName(exp.paidbyuserid)}</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatMoney(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            {/* Transações Pendentes de Confirmação (Credor Vê) */}
            {transactions.filter(t => t.status === 'paymentsent' && t.touserid === user?.id).map(t => (
              <div key={t.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-yellow-500">
                <p className="text-sm"><b>{getMemberName(t.fromuserid)}</b> informou que pagou <b>{formatMoney(t.amount)}</b>.</p>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateTransaction(t, 'reject')}>Recusar</Button>
                  <Button size="sm" className="bg-green-600 text-white" onClick={() => handleUpdateTransaction(t, 'confirm')}>Confirmar</Button>
                </div>
              </div>
            ))}

            {/* Transações Rejeitadas (Devedor Vê) */}
            {transactions.filter(t => t.status === 'rejected' && t.fromuserid === user?.id).map(t => (
                <div key={t.id} className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-3">
                    <AlertTriangle className="text-red-500" />
                    <p className="text-sm text-red-800">Seu pagamento de {formatMoney(t.amount)} para {getMemberName(t.touserid)} foi recusado.</p>
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
                      {p.from === user?.id && !transactions.some(t => t.fromuserid === p.from && t.touserid === p.to && (t.status === 'pending' || t.status === 'paymentsent')) && (
                        <Button size="sm" className="bg-green-600 text-white" onClick={() => handleMarkAsSent(p.to, p.amount)}>Paguei</Button>
                      )}
                      {p.from === user?.id && transactions.some(t => t.fromuserid === p.from && t.touserid === p.to && t.status === 'paymentsent') && (
                          <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Aguardando Confirmação</span>
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
                   <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center font-bold">
                       {(member.userprofiles?.fullname || member.email || '?').charAt(0).toUpperCase()}
                   </div>
                   <div>
                       <p className="font-bold">{getMemberName(member.userid)}</p>
                       <p className="text-xs text-gray-500">{member.email}</p>
                   </div>
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
                <p className="text-sm text-gray-500">{new Date(viewingExpense.date).toLocaleDateString()} • {getMemberName(viewingExpense.paidbyuserid)}</p>
              </div>
              <span className="text-2xl font-black text-brand-600">{formatMoney(viewingExpense.amount)}</span>
            </div>
            
            {isLocked(viewingExpense) ? (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-3">
                    <Lock className="text-red-500 mt-1" size={18} />
                    <div>
                        <p className="text-sm font-bold text-red-900">Despesa Bloqueada</p>
                        <p className="text-xs text-red-700">Esta despesa foi travada automaticamente após um fechamento de caixa.</p>
                    </div>
                </div>
            ) : null}

            <div className="flex gap-3 pt-4">
              {(isLocked(viewingExpense) && user?.id === divvy?.creatorid) ? (
                  <Button fullWidth variant="outline" onClick={() => handleUnlockExpense(viewingExpense)}>
                      <LockOpen size={16} className="mr-2" /> Desbloquear (Criador)
                  </Button>
              ) : (
                <>
                    <Button fullWidth variant="outline" disabled={divvy.isarchived || isLocked(viewingExpense)}>Editar</Button>
                    <Button fullWidth variant="outline" className="text-red-600" disabled={divvy.isarchived || isLocked(viewingExpense)}>Excluir</Button>
                </>
              )}
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
                   <option value="accommodation">🏨 Hospedagem</option>
                   <option value="activity">🎬 Atividade</option>
                   <option value="utilities">💡 Contas</option>
                   <option value="shopping">🛍️ Compras</option>
                   <option value="other">💰 Outros</option>
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium mb-1">Quem pagou?</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-dark-800" value={payerId} onChange={e => setPayerId(e.target.value)}>
                   {members.map(m => <option key={m.userid} value={m.userid}>{m.userid === user?.id ? 'Eu' : getMemberName(m.userid)}</option>)}
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
                     <div key={m.userid} className="flex items-center justify-between p-2">
                         <div className="flex items-center gap-3">
                             {splitType === 'equal' && <input type="checkbox" checked={selectedParticipants.has(m.userid)} onChange={() => { const s = new Set(selectedParticipants); s.has(m.userid) ? s.delete(m.userid) : s.add(m.userid); setSelectedParticipants(s); }} className="w-5 h-5 rounded text-brand-600" />}
                             <span className="text-sm font-medium">{getMemberName(m.userid)}</span>
                         </div>
                         {splitType === 'equal' && <span className="text-xs">{selectedParticipants.has(m.userid) ? formatMoney(parseFloat(amount || '0') / selectedParticipants.size) : '-'}</span>}
                         {splitType === 'exact' && <input type="number" step="0.01" value={manualAmounts[m.userid] || ''} onChange={e => setManualAmounts({ ...manualAmounts, [m.userid]: e.target.value })} className="w-20 p-1 border rounded text-right text-sm" placeholder="0.00" />}
                         {splitType === 'percentage' && <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{formatMoney((parseFloat(amount || '0') * (parseFloat(manualPercentages[m.userid] || '0'))) / 100)}</span><input type="number" value={manualPercentages[m.userid] || ''} onChange={e => setManualPercentages({ ...manualPercentages, [m.userid]: e.target.value })} className="w-16 p-1 border rounded text-right text-sm" placeholder="0%" /></div>}
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
