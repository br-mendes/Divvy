
import React from 'react';
import { Expense } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface ExpenseChartsProps {
  expenses: Expense[];
  members?: { userid: string, userprofiles?: { displayname?: string, fullname?: string, email?: string } }[];
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

const COLORS = ['#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#facc15', '#64748b'];

export const ExpenseCharts: React.FC<ExpenseChartsProps> = ({ expenses, members = [] }) => {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 1. Data for Pie Chart (By Category)
  const categoryData = Object.entries(
    expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, amount]: [string, number]) => ({
    name: categoryTranslations[category] || category.charAt(0).toUpperCase() + category.slice(1),
    value: parseFloat(amount.toFixed(2)),
    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // 2. Data for Bar Chart (By Payer)
  const payerData = Object.entries(
    expenses.reduce((acc, exp) => {
      acc[exp.paidbyuserid] = (acc[exp.paidbyuserid] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([userId, amount]: [string, number]) => {
    const member = members.find(m => m.userid === userId);
    const name = member?.userprofiles?.displayname || member?.userprofiles?.fullname || 'Desconhecido';
    return {
      name,
      amount: parseFloat(amount.toFixed(2))
    };
  }).sort((a, b) => b.amount - a.amount);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p>Sem dados suficientes para gerar gráficos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Category Pie Chart */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 h-[300px]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center md:text-left">Por Categoria</h3>
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
                  color: '#374151'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full md:w-1/2">
           <div className="bg-gray-50 dark:bg-dark-900/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-dark-700">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Gasto</p>
              <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{formatMoney(totalSpent)}</p>
           </div>
           <div className="space-y-3">
              {categoryData.map((item, idx) => (
                 <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                       <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">{formatMoney(item.value)}</span>
                        <span className="text-xs text-gray-400 w-10 text-right">{item.percentage.toFixed(0)}%</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Payer Bar Chart */}
      {payerData.length > 0 && (
        <div className="pt-8 border-t border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quem pagou o quê?</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payerData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: number) => [formatMoney(value), 'Pagou']}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    color: '#374151'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#7c3aed" 
                  radius={[0, 4, 4, 0]} 
                  barSize={30}
                  background={{ fill: '#f3f4f6', radius: [0, 4, 4, 0] }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
