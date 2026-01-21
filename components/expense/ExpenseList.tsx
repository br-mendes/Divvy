
"use client";

import React, { useMemo } from 'react';
import { Expense } from '../../types';
import ExpenseCard from './ExpenseCard';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { Filter, X } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  members: { userid: string, userprofiles?: { fullname?: string, displayname?: string, email?: string } }[];
  loading: boolean;
  onExpenseClick: (expense: Expense) => void;
  formatMoney: (amount: number) => string;
  getMemberName: (uid: string) => string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  filterPayer: string;
  setFilterPayer: (p: string) => void;
}

export default function ExpenseList({
  expenses,
  members,
  loading,
  onExpenseClick,
  formatMoney,
  getMemberName,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  filterPayer,
  setFilterPayer
}: ExpenseListProps) {

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
      if (filterPayer !== 'all' && exp.paidbyuserid !== filterPayer) return false;
      
      if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const descMatch = (exp.description || '').toLowerCase().includes(query);
          const amountMatch = exp.amount.toString().includes(query);
          const categoryMatch = exp.category.toLowerCase().includes(query);
          return descMatch || amountMatch || categoryMatch;
      }
      return true;
    });
  }, [expenses, filterCategory, filterPayer, searchQuery]);

  // Group by Date Logic
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    
    filteredExpenses.forEach(expense => {
      const date = expense.date.split('T')[0]; // YYYY-MM-DD
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
    });

    // Sort dates descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExpenses]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); // Force noon to avoid timezone shift on just date string
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 p-4 bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2 lg:mb-0">
              <Filter size={16} /> <span className="hidden sm:inline">Filtros:</span>
          </div>
          
          {/* Search Input */}
          <div className="relative flex-1">
              <input 
                  type="text" 
                  placeholder="Buscar despesa..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex-1 lg:flex-none px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
              >
                  <option value="all">Todas Categorias</option>
                  <option value="food">🍽️ Alimentação</option>
                  <option value="transport">🚗 Transporte</option>
                  <option value="accommodation">🏨 Hospedagem</option>
                  <option value="activity">🎬 Atividades</option>
                  <option value="utilities">💡 Contas</option>
                  <option value="shopping">🛍️ Compras</option>
                  <option value="other">💰 Outros</option>
              </select>

              <select 
                  value={filterPayer}
                  onChange={(e) => setFilterPayer(e.target.value)}
                  className="flex-1 lg:flex-none px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
              >
                  <option value="all">Todos Pagadores</option>
                  {members.map(m => (
                      <option key={m.userid} value={m.userid}>
                          {getMemberName(m.userid)}
                      </option>
                  ))}
              </select>
          </div>

          {(filterCategory !== 'all' || filterPayer !== 'all' || searchQuery) && (
              <button 
                  onClick={() => { setFilterCategory('all'); setFilterPayer('all'); setSearchQuery(''); }}
                  className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1 justify-center lg:justify-start"
              >
                  <X size={14} /> Limpar
              </button>
          )}
      </div>

      {/* Summary of Filtered Items (if filtering) */}
      {(filterCategory !== 'all' || filterPayer !== 'all' || searchQuery) && !loading && (
        <div className="flex justify-between items-center px-2 text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
           <span>Encontrados: <strong>{filteredExpenses.length}</strong></span>
           <span>Total: <strong>{formatMoney(totalFiltered)}</strong></span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-dark-900 rounded-xl border border-gray-100 dark:border-dark-800">
                <div className="flex items-center gap-4">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                   </div>
                </div>
                <Skeleton className="h-6 w-16" />
             </div>
           ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredExpenses.length === 0 && (
          <EmptyState 
            message="Nenhuma despesa encontrada" 
            description={expenses.length === 0 ? "Adicione uma nova despesa para começar." : "Tente ajustar os filtros para ver os resultados."} 
          />
      )}

      {/* List */}
      {!loading && groupedExpenses.map(([date, exps]) => (
        <div key={date} className="animate-fade-in-up">
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-1 sticky top-20 z-0 bg-gray-50/90 dark:bg-dark-950/90 backdrop-blur-sm py-1 w-fit px-2 rounded-lg">
            {formatDateHeader(date)}
          </h4>
          <div className="space-y-3">
            {exps.map(exp => (
              <ExpenseCard 
                  key={exp.id}
                  expense={exp}
                  payerName={getMemberName(exp.paidbyuserid)}
                  formatMoney={formatMoney}
                  onClick={onExpenseClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
