
import React from 'react';
import { Expense } from '../../types';
import { FileText, Lock } from 'lucide-react';

interface ExpenseCardProps {
  expense: Expense;
  payerName: string;
  onClick: (expense: Expense) => void;
  formatMoney: (amount: number) => string;
}

const categoryIcons: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  activity: '🎬',
  utilities: '💡',
  shopping: '🛍️',
  other: '💰',
};

export default function ExpenseCard({ expense, payerName, onClick, formatMoney }: ExpenseCardProps) {
  return (
    <div 
      onClick={() => onClick(expense)} 
      className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
          {categoryIcons[expense.category] || '💰'}
        </div>
        <div className="min-w-0">
          <p className="font-bold flex items-center gap-2 text-gray-900 dark:text-white truncate pr-2">
            <span className="truncate">{expense.description || expense.category}</span>
            <span className="flex-shrink-0 flex gap-1">
              {expense.receiptphotourl && (
                <span title="Com comprovante"><FileText size={14} className="text-gray-400" /></span>
              )}
              {expense.locked && (
                <span title="Bloqueado"><Lock size={14} className="text-red-500" /></span>
              )}
            </span>
          </p>
          <p className="text-xs text-gray-500 truncate">
            {new Date(expense.date).toLocaleDateString()} • {payerName}
          </p>
        </div>
      </div>
      <span className="font-bold text-lg text-gray-900 dark:text-white whitespace-nowrap pl-2">
        {formatMoney(expense.amount)}
      </span>
    </div>
  );
}
