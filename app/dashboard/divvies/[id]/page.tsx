'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { Divvy, Expense, DivvyMember, Balance } from '@/types';
import { toast } from 'react-hot-toast';

type Tab = 'expenses' | 'balances' | 'members';

const categoryIcons: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  activity: '🎟️',
  utilities: '💡',
  shopping: '🛍️',
  other: '🧾',
  settlement: '✅',
};

export default function DivvyDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();

  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<DivvyMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'other',
  });
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadData();

    const channel = supabase
      .channel('divvy-detail')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `divvy_id=eq.${id}` },
        () => loadExpenses()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'divvy_members', filter: `divvy_id=eq.${id}` },
        () => loadMembers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadData() {
    try {
      const [divvyRes, membersRes] = await Promise.all([
        supabase.from('divvies').select('*').eq('id', id).single(),
        supabase.from('divvy_members').select('*, user:user_profiles(*)').eq('divvy_id', id),
      ]);

      if (divvyRes.data) setDivvy(divvyRes.data);
      if (membersRes.data) setMembers(membersRes.data);

      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados do grupo.');
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses() {
    const { data } = await supabase
      .from('expenses')
      .select('*, paid_by:user_profiles(full_name), splits:expense_splits(*)')
      .eq('divvy_id', id)
      .order('created_at', { ascending: false });

    if (data) setExpenses(data);
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('divvy_members')
      .select('*, user:user_profiles(*)')
      .eq('divvy_id', id);
    if (data) setMembers(data);
  }

  const balances = useMemo(() => {
    const bals: Record<string, Balance> = {};

    members.forEach((member) => {
      bals[member.user_id] = {
        user_id: member.user_id,
        user_name: member.user?.full_name || member.user?.email || 'Desconhecido',
        paid: 0,
        share: 0,
        net: 0,
      };
    });

    expenses.forEach((exp) => {
      if (bals[exp.paid_by_user_id]) {
        bals[exp.paid_by_user_id].paid += Number(exp.amount);
      }

      exp.splits?.forEach((split) => {
        if (bals[split.participant_user_id]) {
          bals[split.participant_user_id].share += Number(split.amount_owed);
        }
      });
    });

    Object.values(bals).forEach((balance) => {
      balance.net = balance.paid - balance.share;
    });

    return Object.values(bals).sort((a, b) => b.net - a.net);
  }, [expenses, members]);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setAddingMember(true);

    try {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newMemberEmail.trim())
        .single();

      if (userError || !userProfile) {
        toast.error('Usuário não encontrado. Peça para ele se cadastrar primeiro.');
        return;
      }

      const { error: insertError } = await supabase.from('divvy_members').insert({
        divvy_id: id,
        user_id: userProfile.id,
        role: 'member',
      });

      if (insertError) {
        if (insertError.code === '23505') toast.error('Usuário já está no grupo.');
        else throw insertError;
      } else {
        toast.success('Membro adicionado!');
        setNewMemberEmail('');
        loadMembers();
      }
    } catch (err) {
      toast.error('Erro ao adicionar membro.');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newExpense.amount || !id) return;
    if (!members.length) {
      toast.error('Adicione membros antes de registrar despesas.');
      return;
    }
    setAddingExpense(true);

    try {
      const amount = parseFloat(newExpense.amount);
      if (Number.isNaN(amount) || amount <= 0) throw new Error('Valor inválido');

      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          divvy_id: id,
          description: newExpense.description || 'Sem descrição',
          amount,
          category: newExpense.category,
          paid_by_user_id: user.id,
          expense_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      const splitAmount = amount / members.length;

      const splitsPayload = members.map((member) => ({
        expense_id: expenseData.id,
        participant_user_id: member.user_id,
        amount_owed: splitAmount,
      }));

      const { error: splitError } = await supabase.from('expense_splits').insert(splitsPayload);
      if (splitError) throw splitError;

      toast.success('Despesa adicionada e dividida!');
      setNewExpense({ description: '', amount: '', category: 'other' });
      loadExpenses();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao adicionar despesa.');
    } finally {
      setAddingExpense(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando Divvy...</div>;
  if (!divvy) return <div className="p-8 text-center text-red-500">Divvy não encontrado.</div>;

  const currentBalance = balances.find((balance) => balance.user_id === user?.id);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">{divvy.name}</h1>
        <p className="text-gray-500 mt-2">{divvy.description || 'Sem descrição'}</p>
        <div className="mt-4 flex items-center text-sm text-gray-500 gap-4">
          <span>{new Date(divvy.created_at).toLocaleDateString()}</span>
          <span>{members.length} participantes</span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'expenses'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Despesas
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'balances'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Saldos
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'members'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Membros
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Adicionar Novo Gasto</h3>
                <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Descrição (ex: Uber)"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-32"
                  />
                  <Button type="submit" loading={addingExpense}>
                    Adicionar
                  </Button>
                </form>
              </div>

              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
                    Nenhuma despesa registrada.
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full text-xl">
                          {categoryIcons[exp.category] || '💸'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{exp.description}</p>
                          <p className="text-xs text-gray-500">
                            {exp.paid_by_user_id === user?.id
                              ? 'Você pagou'
                              : `${exp.paid_by?.full_name} pagou`}{' '}
                            • {new Date(exp.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-gray-900">
                          R$ {Number(exp.amount).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {exp.paid_by_user_id === user?.id ? 'você emprestou' : 'você deve parte'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'balances' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                O cálculo assume divisão igualitária entre todos os membros do grupo.
              </div>
              {balances.map((balance) => (
                <div
                  key={balance.user_id}
                  className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {balance.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {balance.user_id === user?.id ? 'Você' : balance.user_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pagou R$ {balance.paid.toFixed(2)} • Consumiu R${' '}
                        {balance.share.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-right font-bold ${
                      balance.net > 0
                        ? 'text-green-600'
                        : balance.net < 0
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {balance.net > 0
                      ? `Recebe R$ ${balance.net.toFixed(2)}`
                      : balance.net < 0
                      ? `Deve R$ ${Math.abs(balance.net).toFixed(2)}`
                      : 'Quitado'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Convidar Membro</h3>
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email do usuário cadastrado"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                  <Button type="submit" loading={addingMember}>
                    Convidar
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  O usuário deve ter uma conta criada no Divvy para ser adicionado.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-700">Participantes ({members.length})</h3>
                </div>
                <ul>
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="px-6 py-4 border-b last:border-0 flex items-center justify-between"
                    >
                      <span className="text-gray-900 font-medium">
                        {member.user?.full_name || member.user?.email}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          member.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {member.role === 'admin' ? 'Organizador' : 'Membro'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
            <h3 className="font-bold text-indigo-900 mb-2">Resumo Rápido</h3>
            {currentBalance && currentBalance.net > 0 ? (
              <p className="text-green-600 font-bold text-xl">
                Você recebe
                <br />
                R$ {currentBalance.net.toFixed(2)}
              </p>
            ) : currentBalance && currentBalance.net < 0 ? (
              <p className="text-red-600 font-bold text-xl">
                Você deve
                <br />
                R$ {Math.abs(currentBalance.net).toFixed(2)}
              </p>
            ) : (
              <p className="text-gray-600 font-bold">Tudo quitado!</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">
              Atividade Recente
            </h4>
            <ul className="text-sm space-y-3">
              {expenses.slice(0, 5).map((expense) => (
                <li key={expense.id} className="text-gray-600">
                  <span className="font-medium text-gray-900">
                    {expense.paid_by?.full_name?.split(' ')[0]}
                  </span>{' '}
                  pagou R$ {Number(expense.amount).toFixed(0)} em {expense.description}
                </li>
              ))}
              {expenses.length === 0 && <li className="text-gray-400 italic">Sem atividades.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
