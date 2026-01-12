
import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DivvyMember, Expense, ExpenseSplit, Transaction } from '../../types';
import { Button } from '../ui/Button';
import { ArrowRight, Wallet, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BalanceViewProps {
  divvyId: string;
  members: DivvyMember[];
  expenses: Expense[];
  allSplits: ExpenseSplit[];
  transactions: Transaction[];
  onUpdateTransaction: (t: Transaction, action: 'confirm' | 'reject') => void;
  onMarkAsSent: (toUserId: string, amount: number) => void;
}

export default function BalanceView({
  divvyId,
  members,
  expenses,
  allSplits,
  transactions,
  onUpdateTransaction,
  onMarkAsSent
}: BalanceViewProps) {
  const { user } = useAuth();

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

    // Add payments made (creditor)
    expenses.forEach(e => { 
        if (balances[e.paidbyuserid] !== undefined) balances[e.paidbyuserid] += e.amount; 
    });
    
    // Subtract share of expenses (debtor)
    allSplits.forEach(s => { 
        if (balances[s.participantuserid] !== undefined) balances[s.participantuserid] -= s.amountowed; 
    });
    
    // Process Confirmed Transactions (Settlements)
    transactions.filter(t => t.status === 'confirmed').forEach(t => {
      if (balances[t.fromuserid] !== undefined) balances[t.fromuserid] += t.amount; // Debtor paid, so balance increases (less negative)
      if (balances[t.touserid] !== undefined) balances[t.touserid] -= t.amount;     // Creditor received, balance decreases (less positive)
    });

    // Simplify Debts Algorithm
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

    return { plan, balances };
  }, [expenses, allSplits, members, transactions]);

  const { plan } = calculateBalances;

  return (
    <div className="space-y-6">
      {/* Pending Transactions (Received) */}
      {transactions.filter(t => t.status === 'paymentsent' && t.touserid === user?.id).map(t => (
        <div key={t.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-200 dark:border-yellow-900/30 flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-l-yellow-500 animate-fade-in-up">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            <b>{getMemberName(t.fromuserid)}</b> informou que pagou <b>{formatMoney(t.amount)}</b>.
          </p>
          <div className="flex gap-2 w-full md:w-auto">
            <Button size="sm" variant="outline" onClick={() => onUpdateTransaction(t, 'reject')}>Recusar</Button>
            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => onUpdateTransaction(t, 'confirm')}>Confirmar</Button>
          </div>
        </div>
      ))}

      {/* Rejected Transactions (Sent) */}
      {transactions.filter(t => t.status === 'rejected' && t.fromuserid === user?.id).map(t => (
          <div key={t.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-3 animate-fade-in-up">
              <AlertTriangle className="text-red-500" />
              <p className="text-sm text-red-800 dark:text-red-300">
                Seu pagamento de {formatMoney(t.amount)} para {getMemberName(t.touserid)} foi recusado.
              </p>
          </div>
      ))}

      <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm">
        <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
          <Wallet size={20} className="text-brand-500" /> Acertos Sugeridos
        </h3>
        
        <div className="space-y-3">
          {plan.length === 0 ? (
            <div className="text-center py-10">
               <p className="text-gray-500 dark:text-gray-400">Tudo em dia! Ninguém deve nada.</p>
            </div>
          ) : (
            plan.map((p, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-dark-800/50 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100 dark:border-dark-700">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                      {getMemberName(p.from).charAt(0)}
                   </div>
                   <span className="font-semibold">{getMemberName(p.from)}</span>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400">
                      {getMemberName(p.to).charAt(0)}
                   </div>
                   <span className="font-semibold">{getMemberName(p.to)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-brand-600 text-lg">{formatMoney(p.amount)}</span>
                
                {/* Pay Button Logic */}
                {p.from === user?.id && !transactions.some(t => t.fromuserid === p.from && t.touserid === p.to && (t.status === 'pending' || t.status === 'paymentsent')) && (
                  <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => onMarkAsSent(p.to, p.amount)}>
                    Paguei
                  </Button>
                )}
                
                {/* Status Badge */}
                {p.from === user?.id && transactions.some(t => t.fromuserid === p.from && t.touserid === p.to && t.status === 'paymentsent') && (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      Aguardando Confirmação
                    </span>
                )}
              </div>
            </div>
          ))) }
        </div>
      </div>
    </div>
  );
}
