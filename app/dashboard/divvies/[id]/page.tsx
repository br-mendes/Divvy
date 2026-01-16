'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';

export default function DivvyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [divvy, setDivvy] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Realtime subscription
    const channel = supabase
      .channel('room-1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `divvy_id=eq.${id}` }, 
        () => loadData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [id]);

  async function loadData() {
    if (!id) return;
    const [divvyRes, expensesRes] = await Promise.all([
      supabase.from('divvies').select('*').eq('id', id).single(),
      supabase.from('expenses').select('*, paid_by:user_profiles(full_name)').eq('divvy_id', id).order('created_at', { ascending: false })
    ]);

    if (divvyRes.data) setDivvy(divvyRes.data);
    if (expensesRes.data) setExpenses(expensesRes.data);
    setLoading(false);
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newExpense.amount) return;

    const { error } = await supabase.from('expenses').insert({
      divvy_id: id,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paid_by_user_id: user.id
    });

    if (!error) setNewExpense({ description: '', amount: '' });
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!divvy) return <div className="p-6">Divvy não encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">{divvy.name}</h1>
        <p className="text-gray-500 mt-2">{divvy.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Lista de Despesas */}
        <div className="space-y-4">
          <h2 className="font-semibold text-xl">Despesas</h2>
          <div className="space-y-3">
            {expenses.map(exp => (
              <div key={exp.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                <div>
                  <p className="font-medium">{exp.description}</p>
                  <p className="text-sm text-gray-500">Pago por {exp.paid_by?.full_name || 'Alguém'}</p>
                </div>
                <span className="font-bold text-red-500">
                  R$ {exp.amount}
                </span>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-gray-500 italic">Nenhuma despesa ainda.</p>}
          </div>
        </div>

        {/* Adicionar Despesa */}
        <div className="bg-gray-50 p-6 rounded-xl h-fit">
          <h2 className="font-semibold text-xl mb-4">Adicionar Gasto</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <Input 
              label="Descrição" 
              value={newExpense.description}
              onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              placeholder="Ex: Uber, Jantar..."
            />
            <Input 
              label="Valor (R$)" 
              type="number" 
              step="0.01"
              value={newExpense.amount}
              onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
              placeholder="0.00"
            />
            <Button fullWidth type="submit">Adicionar</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
