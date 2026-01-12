
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense, ExpenseSplit, Transaction } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ExpenseCharts } from '../../components/Charts';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import ExpenseForm from '../../components/expense/ExpenseForm';
import InviteModal from '../../components/invite/InviteModal';
import BalanceView from '../../components/balance/BalanceView';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { 
  Plus, UserPlus, Receipt, PieChart, Users, Lock, LockOpen, 
  Wallet, Archive, LucideIcon, FileText, Trash2, Shield
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
  const [isEditingExpense, setIsEditingExpense] = useState(false);

  // Fetch Logic
  const fetchDivvyData = useCallback(async () => {
    if (!divvyId || !user) return;
    
    try {
      const { data: divvyData, error: dErr } = await supabase.from('divvies').select('*').eq('id', divvyId).single();
      if (dErr || !divvyData) { 
        console.error("Group fetch error:", dErr);
        setLoading(false); 
        return; 
      }
      setDivvy(divvyData);

      const { data: membersData, error: mErr } = await supabase
        .from('divvymembers')
        .select(`*, userprofiles:userid (*)`)
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

    // REALTIME SUBSCRIPTION
    const channel = supabase.channel(`divvy_room_${divvyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `divvyid=eq.${divvyId}` }, () => fetchDivvyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `divvyid=eq.${divvyId}` }, () => fetchDivvyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divvymembers', filter: `divvyid=eq.${divvyId}` }, () => fetchDivvyData())
      // Also listen for Divvy updates (archived/locked status)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'divvies', filter: `id=eq.${divvyId}` }, () => fetchDivvyData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDivvyData, divvyId]);

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.userid === uid);
    if (!m) return 'Membro';
    const p = m.userprofiles;
    return p?.displayname || p?.fullname || m.email?.split('@')[0] || 'Participante';
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const isLocked = (exp: Expense) => exp.locked;
  const isCreator = user?.id === divvy?.creatorid;

  // --- ACTIONS WITH API ---
  const handleUpdateTransaction = async (t: Transaction, action: 'confirm' | 'reject') => {
    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    if (!confirm(`Deseja ${action === 'confirm' ? 'confirmar' : 'rejeitar'} este pagamento?`)) return;
    
    const toastId = toast.loading("Processando...");
    try {
        const endpoint = action === 'confirm' ? '/api/payments/confirm' : '/api/payments/reject';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactionId: t.id,
                userId: user?.id
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao processar');

        toast.success(`Pagamento ${newStatus === 'confirmed' ? 'confirmado' : 'rejeitado'}.`, { id: toastId });
        fetchDivvyData();
    } catch (e: any) { 
        toast.error(e.message, { id: toastId }); 
    }
  };

  const handleMarkAsSent = async (to: string, amount: number) => {
    if (!confirm(`Confirmar que você enviou ${formatMoney(amount)} para ${getMemberName(to)}?`)) return;
    
    const toastId = toast.loading("Registrando...");
    try {
      const response = await fetch('/api/payments/mark-sent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              divvyId,
              fromUserId: user?.id,
              toUserId: to,
              amount
          })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao registrar');

      toast.success('Pagamento registrado! Credor notificado.', { id: toastId });
      fetchDivvyData();
    } catch (e: any) { 
      toast.error(e.message, { id: toastId }); 
    }
  };

  const handleUnlockExpense = async (exp: Expense) => {
      if (!isCreator) return;
      if (!confirm("Desbloquear despesa manualmente?")) return;
      try {
          await supabase.from('expenses').update({ locked: false, lockedreason: null, lockedat: null }).eq('id', exp.id);
          toast.success("Despesa desbloqueada.");
          setIsViewModalOpen(false);
          // fetchDivvyData handled by realtime
      } catch(e: any) { toast.error(e.message); }
  };

  const handleDeleteExpense = async () => {
      if (!viewingExpense) return;
      if (!confirm("Tem certeza que deseja excluir esta despesa? Isso afetará os saldos.")) return;
      try {
          // Utilizar API DELETE para segurança
          const res = await fetch(`/api/expenses/${viewingExpense.id}`, { method: 'DELETE' });
          
          if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Erro ao excluir');
          }
          
          toast.success("Despesa excluída.");
          setIsViewModalOpen(false);
          setViewingExpense(null);
      } catch(e: any) {
          toast.error(e.message);
      }
  };

  const handleEditExpense = () => {
      setIsEditingExpense(true);
      setIsExpenseModalOpen(true);
  };

  const handleArchiveGroup = async () => {
      if(!divvy || !user) return;
      try {
          const res = await fetch('/api/groups/archive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ divvyId: divvy.id, userId: user.id })
          });
          
          if (!res.ok) throw new Error('Erro ao arquivar');
          
          toast.success("Grupo arquivado.");
      } catch(e: any) { toast.error(e.message); }
  };

  const handleDismissArchive = async () => {
    if (!divvy || !user) return;
    try { 
        const res = await fetch('/api/groups/dismiss-archive-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ divvyId: divvy.id, userId: user.id })
        });
        
        if (!res.ok) throw new Error('Erro ao ocultar');
        
        toast.success("Sugestão ocultada."); 
    } 
    catch(e: any) { toast.error(e.message); }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!isCreator) return;
    if (memberUserId === user?.id) {
        toast.error("Você não pode remover a si mesmo. Use a opção 'Sair do grupo' nas configurações.");
        return;
    }
    
    if (!confirm(`Tem certeza que deseja remover ${memberName} do grupo? O histórico de despesas pagas por ele permanecerá, mas ele perderá acesso.`)) return;

    const toastId = toast.loading("Removendo...");
    try {
        const { error } = await supabase.from('divvymembers')
            .delete()
            .eq('divvyid', divvyId)
            .eq('userid', memberUserId);
        
        if (error) throw error;
        toast.success(`${memberName} removido.`, { id: toastId });
    } catch (e: any) {
        toast.error("Erro ao remover: " + e.message, { id: toastId });
    }
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
                {isCreator && <Button size="sm" onClick={handleArchiveGroup}>Arquivar Agora</Button>}
            </div>
        </div>
      )}

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus size={18} className="mr-2" /> Convidar</Button>
        <Button onClick={() => { setViewingExpense(null); setIsEditingExpense(false); setIsExpenseModalOpen(true); }} disabled={divvy.isarchived}>
            <Plus size={18} className="mr-2" /> Nova Despesa
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
              <div key={exp.id} onClick={() => { setViewingExpense(exp); setIsEditingExpense(false); setIsViewModalOpen(true); }} className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {exp.category === 'food' ? '🍽️' : exp.category === 'transport' ? '🚗' : exp.category === 'shopping' ? '🛍️' : '💰'}
                  </div>
                  <div>
                    <p className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        {exp.description || exp.category} 
                        {exp.receiptphotourl && <span title="Com comprovante"><FileText size={14} className="text-gray-400" /></span>}
                        {isLocked(exp) && <span title="Bloqueado"><Lock size={14} className="text-red-500" /></span>}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {getMemberName(exp.paidbyuserid)}</p>
                  </div>
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">{formatMoney(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'balances' && (
          <BalanceView 
            divvyId={divvyId}
            members={members}
            expenses={expenses}
            allSplits={allSplits}
            transactions={transactions}
            onUpdateTransaction={handleUpdateTransaction}
            onMarkAsSent={handleMarkAsSent}
          />
        )}
        
        {activeTab === 'charts' && <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800"><ExpenseCharts expenses={expenses} /></div>}
        
        {activeTab === 'members' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {members.map(member => {
               const memberName = getMemberName(member.userid);
               return (
               <div key={member.id} className="bg-white dark:bg-dark-900 p-4 rounded-xl border border-gray-100 dark:border-dark-800 flex items-center justify-between group hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center overflow-hidden">
                       {member.userprofiles?.avatarurl ? (
                           <img src={member.userprofiles.avatarurl} alt={memberName} className="w-full h-full object-cover" />
                       ) : (
                           <span className="font-bold text-gray-600 dark:text-gray-300">
                               {(member.userprofiles?.fullname || member.email || '?').charAt(0).toUpperCase()}
                           </span>
                       )}
                   </div>
                   <div>
                       <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                           {memberName}
                           {divvy?.creatorid === member.userid && (
                             <span title="Criador do Grupo" className="flex items-center">
                               <Shield size={12} className="text-brand-500 fill-brand-500" />
                             </span>
                           )}
                       </p>
                       <p className="text-xs text-gray-500">{member.email}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black px-2 py-1 bg-gray-100 dark:bg-dark-800 rounded text-gray-500">
                        {member.role === 'admin' ? 'Admin' : 'Membro'}
                    </span>
                    {isCreator && member.userid !== user?.id && (
                        <button 
                            onClick={() => handleRemoveMember(member.userid, memberName)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remover membro"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                 </div>
               </div>
             )})}
           </div>
        )}
      </div>

      {/* VIEW EXPENSE DETAILS MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes da Despesa">
        {viewingExpense && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{viewingExpense.description || viewingExpense.category}</h3>
                <p className="text-sm text-gray-500">{new Date(viewingExpense.date).toLocaleDateString()} • {getMemberName(viewingExpense.paidbyuserid)}</p>
              </div>
              <span className="text-2xl font-black text-brand-600">{formatMoney(viewingExpense.amount)}</span>
            </div>
            
            {viewingExpense.receiptphotourl && (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700">
                    <img src={viewingExpense.receiptphotourl} alt="Comprovante" className="w-full object-cover max-h-64" />
                    <div className="p-2 bg-gray-50 dark:bg-dark-800 text-xs text-center text-gray-500">
                        <a href={viewingExpense.receiptphotourl} target="_blank" rel="noreferrer" className="underline hover:text-brand-600">Ver original</a>
                    </div>
                </div>
            )}

            {isLocked(viewingExpense) ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-3">
                    <Lock className="text-red-500 mt-1" size={18} />
                    <div>
                        <p className="text-sm font-bold text-red-900 dark:text-red-300">Despesa Bloqueada</p>
                        <p className="text-xs text-red-700 dark:text-red-400">Esta despesa foi travada automaticamente após um fechamento de caixa.</p>
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
                    <Button fullWidth variant="outline" onClick={() => { setIsViewModalOpen(false); handleEditExpense(); }} disabled={divvy?.isarchived || isLocked(viewingExpense)}>Editar</Button>
                    <Button fullWidth variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDeleteExpense} disabled={divvy?.isarchived || isLocked(viewingExpense)}>Excluir</Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT EXPENSE MODAL */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title={isEditingExpense ? "Editar Despesa" : "Nova Despesa"} size="lg">
        <ExpenseForm 
            divvyId={divvyId} 
            members={members} 
            onSuccess={() => { setIsExpenseModalOpen(false); setViewingExpense(null); }} 
            onCancel={() => setIsExpenseModalOpen(false)}
            initialData={isEditingExpense && viewingExpense ? viewingExpense : undefined}
        />
      </Modal>

      <InviteModal divvyId={divvyId} divvyName={divvy?.name || ''} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};

export default function DivvyDetail() { return <ProtectedRoute><DivvyDetailContent /></ProtectedRoute>; }
