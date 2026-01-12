
import React from 'react';
import { Expense } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseChartsProps {
  expenses: Expense[];
}

const categoryTranslations: Record<string, string> = {
  food: 'Alimentação',
  transport: 'Transporte',
  accommodation: 'Hospedagem',
  activity: 'Atividades',
  utilities: 'Contas',
  shopping: 'Compras',
  other: 'Outros',
};

const formatMoney = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
};

export const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ expenses }) => {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryData = Object.entries(
    expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, amount]: [string, number]) => ({
    name: categoryTranslations[category] || category.charAt(0).toUpperCase() + category.slice(1),
    value: parseFloat(amount.toFixed(2)),
    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
  }));

  const COLORS = ['#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#facc15', '#64748b'];

  if (expenses.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-8">Sem dados para exibir.</p>;
  }

  // Ordenar do maior para o menor
  categoryData.sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="w-full md:w-1/2 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${formatMoney(value)} (${props.payload.percentage.toFixed(1)}%)`, 
                name
              ]} 
              contentStyle={{ 
                backgroundColor: 'var(--tw-color-white, #fff)', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full md:w-1/2">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo de Gastos</h3>
         <div className="bg-gray-50 dark:bg-dark-900/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-dark-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Gasto</p>
            <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{formatMoney(totalSpent)}</p>
         </div>
         <div className="space-y-4">
            {categoryData.map((item, idx) => (
               <div key={item.name} className="flex flex-col pb-2 border-b border-gray-50 dark:border-dark-800 last:border-0">
                 <div className="flex justify-between text-sm items-center mb-1.5">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2 font-semibold">
                       <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                       {item.name}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatMoney(item.value)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 pl-4.5">
                    <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-1.5 mr-3 max-w-[120px]">
                        <div 
                            className="h-1.5 rounded-full transition-all duration-500" 
                            style={{ 
                                width: `${item.percentage}%`, 
                                backgroundColor: COLORS[idx % COLORS.length] 
                            }}
                        ></div>
                    </div>
                    <span className="font-mono">{item.percentage.toFixed(1)}%</span>
                 </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};
