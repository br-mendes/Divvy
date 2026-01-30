
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { BalancePair, DivvyMember, Expense, ExpenseSplit, Transaction, PaymentMethod } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ArrowRight, Wallet, CheckCircle, Clock, XCircle, History, ChevronDown, ChevronUp, Copy, Phone, QrCode, Banknote, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { POPULAR_BANKS } from '../../lib/constants';

interface BalanceViewProps {
  divvyId: string;
  members: DivvyMember[];
  expenses: Expense[];
  allSplits: ExpenseSplit[];
  transactions: Transaction[];
  onUpdateTransaction: (t: Transaction, action: 'confirm' | 'reject') => void;
  onMarkAsSent: (transactionId: string) => void;
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
  const [showHistory, setShowHistory] = useState(false);
  const [plan, setPlan] = useState<BalancePair[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<{ to: string; amount: number; transactionId: string } | null>(null);
  
  // Loaded Payment Methods for the target user
  const [targetPaymentMethods, setTargetPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);

  const getMemberName = (uid: string) => {
    const m = members.find(m => m.userid === uid);
    if (!m) return 'Membro';
    const p = m.userprofiles;
    return p?.displayname || p?.fullname || m.email?.split('@')[0] || 'Participante';
  };

  const getMemberPhone = (uid: string) => {
    const m = members.find(m => m.userid === uid);
    return m?.userprofiles?.phone || null;
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  useEffect(() => {
    if (!divvyId) return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchBalances = async () => {
      setPlanLoading(true);
      try {
        const response = await fetch(`/api/balance.active?divvyId=${divvyId}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('Erro ao buscar os saldos');
        }
        const data = await response.json();
        if (isMounted) {
          setPlan(data?.balances || []);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Erro ao buscar saldos:', error);
          if (isMounted) setPlan([]);
        }
      } finally {
        if (isMounted) setPlanLoading(false);
      }
    };

    fetchBalances();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [divvyId, expenses, allSplits, transactions]);

  const getPlanName = (userId: string, displayName?: string | null) => {
    return displayName || getMemberName(userId);
  };

  // Separate transactions
  const pendingReceived = transactions.filter(t => t.status === 'paymentsent' && t.touserid === user?.id);
  const rejectedSent = transactions.filter(t => t.status === 'rejected' && t.fromuserid === user?.id);
  const historyTransactions = transactions.filter(t => t.status === 'confirmed' || t.status === 'rejected' || (t.status === 'paymentsent' && t.touserid !== user?.id));

  const handlePayClick = async (to: string, amount: number, existingTransactionId?: string) => {
    setPaymentModalOpen(true);
    setMethodsLoading(true);
    setTargetPaymentMethods([]);

    try {
        let transactionId = existingTransactionId;

        if (!transactionId) {
            const response = await fetch('/api/payments/create-pending', {
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
            if (!response.ok) throw new Error(data.error || 'Erro ao iniciar pagamento');
            transactionId = data.transaction?.id;
        }

        if (!transactionId) {
            throw new Error('Transação pendente não encontrada.');
        }

        setSelectedDebt({ to, amount, transactionId });

        const { data } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', to)
            .eq('is_active', true)
            .order('is_primary', { ascending: false });
        
        if (data) setTargetPaymentMethods(data);
    } catch (e) {
        console.error("Error fetching payment methods", e);
        toast.error('Não foi possível iniciar o pagamento.');
        setPaymentModalOpen(false);
    } finally {
        setMethodsLoading(false);
    }
  };

  const confirmPayment = () => {
    if (selectedDebt) {
      onMarkAsSent(selectedDebt.transactionId);
      setPaymentModalOpen(false);
      setSelectedDebt(null);
    }
  };

  const getBankName = (code?: string) => {
    return POPULAR_BANKS.find(b => b.code === code)?.name || 'Banco';
  };

  return (
    <div className="space-y-6">
      {/* 1. Action Items (Top Priority) */}
      
      {/* Pending Transactions (Received) - Requires Action */}
      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Aguardando sua confirmação</h4>
          {pendingReceived.map(t => (
            <div key={t.id} className="bg-white dark:bg-dark-900 p-4 rounded-xl border-l-4 border-yellow-500 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse-slow">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-500" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    <span className="font-bold">{getMemberName(t.fromuserid)}</span> marcou como pago
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(t.amount)}</p>
                  <p className="text-xs text-gray-500">{new Date(t.updatedat).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button size="sm" variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20" onClick={() => onUpdateTransaction(t, 'reject')}>
                  Recusar
                </Button>
                <Button size="sm" className="flex-1 md:flex-none bg-green-600 text-white hover:bg-green-700" onClick={() => onUpdateTransaction(t, 'confirm')}>
                  Confirmar Recebimento
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejected Transactions (Sent) - Requires Attention */}
      {rejectedSent.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider">Pagamentos Recusados</h4>
          {rejectedSent.map(t => (
              <div key={t.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-4">
                  <XCircle className="text-red-500 w-8 h-8" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200 font-bold">
                      Seu pagamento de {formatMoney(t.amount)} para {getMemberName(t.touserid)} foi recusado.
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      Entre em contato com o membro e tente novamente se necessário.
                    </p>
                  </div>
              </div>
          ))}
        </div>
      )}

      {/* 2. Settlement Plan */}
      <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl border border-gray-100 dark:border-dark-800 shadow-sm">
        <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
          <Wallet size={20} className="text-brand-500" /> Acertos Sugeridos (Quem deve quem)
        </h3>
        
        <div className="space-y-3">
          {planLoading ? (
            <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
              Carregando saldos...
            </div>
          ) : plan.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
               <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="text-green-500 w-8 h-8" />
               </div>
               <p className="text-gray-900 dark:text-white font-medium">Tudo em dia!</p>
               <p className="text-sm text-gray-500 dark:text-gray-400">Ninguém deve nada neste grupo.</p>
            </div>
          ) : (
            plan.map((p, i) => {
              const fromName = p.from === user?.id ? 'Você' : getPlanName(p.from, p.fromDisplayName);
              const toName = p.to === user?.id ? 'Você' : getPlanName(p.to, p.toDisplayName);
              return (
            <div key={i} className="p-4 bg-gray-50 dark:bg-dark-800/50 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100 dark:border-dark-700 relative overflow-hidden">
              {/* Highlight if user is involved */}
              {(p.from === user?.id || p.to === user?.id) && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${p.from === user?.id ? 'bg-red-500' : 'bg-green-500'}`}></div>
              )}
              
              <div className="flex items-center gap-3 text-gray-900 dark:text-white w-full sm:w-auto justify-center sm:justify-start">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                      {fromName.charAt(0)}
                   </div>
                   <span className={`font-semibold ${p.from === user?.id ? 'text-red-600 dark:text-red-400' : ''}`}>
                     {fromName}
                   </span>
                </div>
                
                <div className="flex flex-col items-center px-2">
                   <span className="text-[10px] text-gray-400 uppercase font-bold">Deve</span>
                   <ArrowRight size={14} className="text-gray-400" />
                </div>

                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400">
                      {toName.charAt(0)}
                   </div>
                   <span className={`font-semibold ${p.to === user?.id ? 'text-green-600 dark:text-green-400' : ''}`}>
                     {toName}
                   </span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-bold text-gray-900 dark:text-white text-lg">{formatMoney(p.amount)}</span>
                
                {/* Pay Button Logic */}
                {p.from === user?.id && (() => {
                  const pendingTransaction = transactions.find(t => t.fromuserid === p.from && t.touserid === p.to && t.status === 'pending');
                  const hasPaymentSent = transactions.some(t => t.fromuserid === p.from && t.touserid === p.to && t.status === 'paymentsent');

                  if (hasPaymentSent) return null;

                  return (
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-500/20"
                      onClick={() => handlePayClick(p.to, p.amount, pendingTransaction?.id)}
                    >
                      {pendingTransaction ? 'Registrar envio' : 'Paguei'}
                    </Button>
                  );
                })()}
                
                {/* Status Badge */}
                {p.from === user?.id && transactions.some(t => t.fromuserid === p.from && t.touserid === p.to && t.status === 'paymentsent') && (
                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Clock size={12} /> Aguardando
                    </span>
                )}
              </div>
            </div>
            );
          })) }
        </div>
      </div>

      {/* 3. Transaction History */}
      <div className="border-t border-gray-200 dark:border-dark-700 pt-6">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-left text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800"
        >
          <span className="flex items-center gap-2 font-medium">
            <History size={18} /> Histórico de Pagamentos
          </span>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showHistory && (
          <div className="mt-4 space-y-2 animate-fade-in-down">
            {historyTransactions.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-4">Nenhum pagamento registrado.</p>
            ) : (
              historyTransactions.map(t => {
                const isReceived = t.touserid === user?.id;
                const isSent = t.fromuserid === user?.id;
                
                return (
                <div key={t.id} className="flex justify-between items-center p-3 text-sm border-b border-gray-100 dark:border-dark-800 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                        t.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                        t.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                        'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
                    }`}>
                       {isReceived ? <ArrowDownLeft size={16} /> : isSent ? <ArrowUpRight size={16} /> : <History size={16} />}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {isSent ? `Você pagou para ${getMemberName(t.touserid)}` : 
                         isReceived ? `Você recebeu de ${getMemberName(t.fromuserid)}` :
                         `${getMemberName(t.fromuserid)} pagou para ${getMemberName(t.touserid)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.updatedat).toLocaleDateString()} {new Date(t.updatedat).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${
                      t.status === 'confirmed' ? 'text-green-600' : 
                      t.status === 'rejected' ? 'text-red-600 line-through' : 
                      'text-yellow-600'
                    }`}>
                      {formatMoney(t.amount)}
                    </span>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                      {t.status === 'paymentsent' ? 'Enviado' : t.status === 'confirmed' ? 'Confirmado' : 'Recusado'}
                    </p>
                  </div>
                </div>
              )})
            )}
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Realizar Pagamento">
        {selectedDebt && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Você deve pagar para</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getMemberName(selectedDebt.to)}</h3>
              <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{formatMoney(selectedDebt.amount)}</p>
            </div>

            <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl border border-gray-200 dark:border-dark-700">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Dados de Pagamento
              </p>
              
              {methodsLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Carregando métodos...</div>
              ) : targetPaymentMethods.length > 0 ? (
                  <div className="space-y-3">
                      {targetPaymentMethods.map((method) => (
                          <div key={method.id} className="bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
                              <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                      {method.type === 'pix' ? <QrCode size={16} className="text-brand-500" /> : <Banknote size={16} className="text-green-500" />}
                                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                          {method.type === 'pix' ? 'Chave Pix' : getBankName(method.bank_id)}
                                      </span>
                                  </div>
                                  <button 
                                    onClick={() => { 
                                        const text = method.type === 'pix' ? method.pix_key : `${method.account_number} ${method.agency}`;
                                        if(text) navigator.clipboard.writeText(text); 
                                        toast.success('Copiado!'); 
                                    }} 
                                    className="text-brand-600 hover:text-brand-700 p-1"
                                    title="Copiar"
                                  >
                                      <Copy size={14} />
                                  </button>
                              </div>
                              
                              {method.type === 'pix' ? (
                                  <p className="font-mono text-sm text-gray-600 dark:text-gray-300 break-all">{method.pix_key}</p>
                              ) : (
                                  <div className="text-sm text-gray-600 dark:text-gray-300">
                                      <p>Ag: {method.agency} | CC: {method.account_number}-{method.account_digit}</p>
                                      <p className="text-xs text-gray-400 mt-1">{method.account_holder_name}</p>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              ) : getMemberPhone(selectedDebt.to) ? (
                // Fallback to phone if no payment methods set
                <div className="flex items-center justify-between bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="font-mono text-lg text-gray-900 dark:text-white select-all">
                        {getMemberPhone(selectedDebt.to)}
                      </span>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(getMemberPhone(selectedDebt.to) || ''); toast.success('Copiado!'); }} 
                    className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm italic">
                  Este membro não possui dados de pagamento cadastrados.
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 text-sm text-blue-700 dark:text-blue-300">
              <p><strong>Atenção:</strong> O Divvy não processa pagamentos reais. Faça a transferência pelo seu banco e depois confirme abaixo.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" fullWidth onClick={confirmPayment}>
                Já paguei, confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
