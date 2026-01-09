
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ExpenseCharts } from '../../components/Charts';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import InviteModal from '../../components/invite/InviteModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, UserPlus, Receipt, PieChart, Users, Pencil, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [members, setMembers] = useState<DivvyMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'charts' | 'members'>('expenses');
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [desc, setDesc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchDivvyData();
    }
  }, [id, user]);

  const fetchDivvyData = async () => {
    try {
      // Fetch Divvy Details
      const { data: divvyData } = await supabase
        .from('divvies')
        .select('*')
        .eq('id', id)
        .single();
      setDivvy(divvyData);

      // Fetch Members
      const { data: memberData } = await supabase
        .from('divvy_members')
        .select('*')
        .eq('divvy_id', id);
      setMembers(memberData || []);

      // Fetch Expenses
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .eq('divvy_id', id)
        .order('date', { ascending: false });
      setExpenses(expenseData || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setAmount('');
    setCategory('food');
    setDesc('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDesc(exp.description);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !divvy) return;
    setSubmitLoading(true);

    try {
      let expenseId = editingExpenseId;

      if (editingExpenseId) {
        // UPDATE existing expense
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            amount: parseFloat(amount),
            category,
            description: desc,
            // Mantém data original ou atualiza se desejado. Aqui mantemos simples.
          })
          .eq('id', editingExpenseId);

        if (updateError) throw updateError;
      } else {
        // CREATE new expense
        const { data: newExpense, error: insertError } = await supabase
          .from('expenses')
          .insert({
            divvy_id: divvy.id,
            paid_by_user_id: user.id,
            amount: parseFloat(amount),
            category,
            description: desc,
            date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newExpense) expenseId = newExpense.id;
      }

      // RECALCULATE SPLITS (Simplified Strategy: Delete old splits & create new even splits)
      // This happens for both Create and Update to ensure consistency if amount/members changed.
      if (expenseId && members.length > 0) {
        // 1. Delete existing splits
        await supabase.from('expense_splits').delete().eq('expense_id', expenseId);

        // 2. Create new splits
        const splitAmount = parseFloat(amount) / members.length;
        const splits = members.map(m => ({
          expense_id: expenseId,
          participant_user_id: m.user_id,
          amount_owed: splitAmount
        }));

        await supabase.from('expense_splits').insert(splits);
      }

      toast.success(editingExpenseId ? 'Despesa atualizada!' : 'Despesa adicionada!');
      setIsExpenseModalOpen(false);
      fetchDivvyData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error('Erro ao salvar despesa: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
      toast.success('Despesa excluída');
      fetchDivvyData();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (!divvy) return <div className="text-center p-12">Divvy não encontrado</div>;

  return (
    <div className="space-y-6">
      <DivvyHeader divvy={divvy} onUpdate={fetchDivvyData} />

      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Convidar
        </Button>
        <Button onClick={handleOpenAddExpense}>
          <Plus size={18} className="mr-2" />
          Nova Despesa
        </Button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Receipt size={16} />
            Despesas
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'charts'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <PieChart size={16} />
            Análise
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={16} />
            Membros ({members.length})
          </button>
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <EmptyState />
            ) : (
              expenses.map((exp) => {
                const canEdit = user?.id === exp.paid_by_user_id;
                
                return (
                  <div key={exp.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                        {exp.category === 'food' ? '🍽️' : 
                         exp.category === 'transport' ? '🚗' : 
                         exp.category === 'accommodation' ? '🏨' : 
                         exp.category === 'activity' ? '🎬' : '💰'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{exp.description || exp.category}</p>
                        <p className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right mr-2">
                        <p className="font-bold text-gray-900">R$ {exp.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Pago por {members.find(m => m.user_id === exp.paid_by_user_id)?.email.split('@')[0] || 'Desconhecido'}</p>
                      </div>
                      
                      {canEdit && (
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100">
             <ExpenseCharts expenses={expenses} />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(member => (
              <div key={member.id} className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title={editingExpenseId ? "Editar Despesa" : "Adicionar Despesa"}
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <Input
             label="Valor (R$)"
             type="number"
             step="0.01"
             value={amount}
             onChange={(e: any) => setAmount(e.target.value)}
             required
             placeholder="0,00"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="food">🍽️ Alimentação</option>
              <option value="transport">🚗 Transporte</option>
              <option value="accommodation">🏨 Hospedagem</option>
              <option value="activity">🎬 Atividade/Lazer</option>
              <option value="utilities">💡 Contas/Serviços</option>
              <option value="shopping">🛍️ Compras</option>
              <option value="other">💰 Outro</option>
            </select>
          </div>
          <Input
            label="Descrição"
            value={desc}
            onChange={(e: any) => setDesc(e.target.value)}
            placeholder="No que foi gasto?"
          />
          <div className="flex justify-end gap-3 mt-4">
             <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
             <Button type="submit" isLoading={submitLoading}>
               {editingExpenseId ? 'Salvar Alterações' : 'Salvar'}
             </Button>
          </div>
        </form>
      </Modal>

      <InviteModal 
        divvyId={divvy.id}
        divvyName={divvy.name}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default function DivvyDetail() {
  return (
    <ProtectedRoute>
      <DivvyDetailContent />
    </ProtectedRoute>
  );
}
