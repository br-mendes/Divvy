import { useState } from 'react';
import { Receipt, PieChart, Users, ClipboardList } from 'lucide-react';
import { ExpenseCharts } from '../Charts';
import EmptyState from '../ui/EmptyState';
import { RequestsPanel } from './RequestsPanel';
import { DivvyMember, Expense } from '../../types';

type TabKey = 'expenses' | 'charts' | 'members' | 'requests';

type GroupTabsProps = {
  divvyId: string;
  members: DivvyMember[];
  expenses: Expense[];
};

export default function GroupTabs({ divvyId, members, expenses }: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('expenses');

  return (
    <div>
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
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardList size={16} />
            Requests
          </button>
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <EmptyState />
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-xl">
                      {exp.category === 'food'
                        ? '🍽️'
                        : exp.category === 'transport'
                        ? '🚗'
                        : exp.category === 'accommodation'
                        ? '🏨'
                        : exp.category === 'activity'
                        ? '🎬'
                        : '💰'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{exp.description || exp.category}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(exp.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">R$ {exp.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      Paid by{' '}
                      {members.find((m) => m.userid === exp.paidbyuserid)?.email.split('@')[0] ||
                        'Unknown'}
                    </p>
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
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3"
              >
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

        {activeTab === 'requests' && <RequestsPanel divvyId={divvyId} members={members} />}
      </div>
    </div>
  );
}
