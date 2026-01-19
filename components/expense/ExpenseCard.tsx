
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

function ColorDot({ color }: { color?: string | null }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded align-middle"
      style={{ backgroundColor: color ?? '#64748B' }}
      aria-hidden
    />
  );
}

function CategoryChip({ name, color }: { name?: string | null; color?: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 border rounded px-2 py-0.5 text-xs">
      <ColorDot color={color} />
      <span className="truncate">{name}</span>
    </span>
  );
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, payerName, onClick, formatMoney }) => {
  const categoryData = expense.category as
    | string
    | { name?: string | null; color?: string | null };
  const categoryName =
    typeof categoryData === 'string' ? categoryData : categoryData?.name;
  const categoryColor =
    typeof categoryData === 'string' ? null : categoryData?.color ?? null;

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
          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
            <span>{new Date(expense.date).toLocaleDateString()}</span>
            <span>•</span>
            <span>pagou: <b>{payerName}</b></span>
            {categoryName && (
              <>
                <span>•</span>
                <CategoryChip name={categoryName} color={categoryColor} />
              </>
            )}
          </div>
        </div>
      </div>
      <span className="font-bold text-lg text-gray-900 dark:text-white whitespace-nowrap pl-2">
        {formatMoney(expense.amount)}
      </span>
    </div>
  );
};

export default ExpenseCard;
