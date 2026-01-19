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
import { Plus, UserPlus, Receipt, PieChart, Users } from 'lucide-react';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [members, setMembers] = useState<DivvyMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'charts' | 'members'>('expenses');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Expense Form
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
        .from('divvymembers')
        .select('*')
        .eq('divvyid', id);
      setMembers(memberData || []);

      // Fetch Expenses
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .eq('divvyid', id)
        .order('date', { ascending: false });
      setExpenses(expenseData || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !divvy) return;
    setSubmitLoading(true);

    try {
      // 1. Create Expense
      const { data: expense, error: expError } = await supabase
        .from('expenses')
        .insert({
          divvyid: divvy.id,
          paidbyuserid: user.id,
          amount: parseFloat(amount),
          category,
          description: desc,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (expError) throw expError;

      // 2. Create Splits (Simplified: Even split for all members for MVP)
      if (expense && members.length > 0) {
        const splitAmount = parseFloat(amount) / members.length;
        const splits = members.map(m => ({
          expenseid: expense.id,
          participantuserid: m.userid,
          amountowed: splitAmount
        }));

        await supabase.from('expensesplits').insert(splits);
      }

      setIsExpenseModalOpen(false);
      setAmount('');
      setDesc('');
      fetchDivvyData();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (!divvy) return <div className="text-center p-12">Divvy not found</div>;

  const visibleExpenses = filterCategoryId
    ? expenses.filter((e: any) => String(e.categoryid ?? '') === filterCategoryId)
    : expenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <DivvyHeader divvy={divvy} />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 px-1">
        <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus size={18} className="mr-2" />
          Invite
        </Button>
        <Button onClick={() => setIsExpenseModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Tabs */}
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
            Expenses
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
            Analysis
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
            Members ({members.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {visibleExpenses.length === 0 ? (
              <div className="opacity-70">
                {filterCategoryId ? 'Nenhuma despesa nesta categoria.' : 'Nenhuma despesa ainda.'}
              </div>
            ) : (
              visibleExpenses.map((exp) => (
                <div key={exp.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl">
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
                  <div className="text-right">
                    <p className="font-bold text-gray-900">R$ {exp.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Paid by {members.find(m => m.userid === exp.paidbyuserid)?.email.split('@')[0] || 'Unknown'}</p>
                  </div>
                </div>
              ))
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

      {/* Add Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add New Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
             label="Amount (R$)"
             type="number"
             step="0.01"
             value={amount}
             onChange={(e) => setAmount(e.target.value)}
             required
             placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="food">🍽️ Food</option>
              <option value="transport">🚗 Transport</option>
              <option value="accommodation">🏨 Accommodation</option>
              <option value="activity">🎬 Activity</option>
              <option value="utilities">💡 Utilities</option>
              <option value="shopping">🛍️ Shopping</option>
              <option value="other">💰 Other</option>
            </select>
          </div>
          <Input
            label="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What was this for?"
          />
          <div className="flex justify-end gap-3 mt-4">
             <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
             <Button type="submit" isLoading={submitLoading}>Save Expense</Button>
          </div>
        </form>
      </Modal>

      {/* Invite Modal */}
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
