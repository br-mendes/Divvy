'use client';

import { useEffect, useState } from 'react';

type BalancesPanelProps = {
  divvyId: string;
};

type BalancesResponse = {
  member_balances: Array<{
    user_id: string;
    full_name: string;
    email: string;
    role: string;
    total_paid: number;
    total_owes: number;
    net_balance: number;
    balance_amount: number;
    color: string;
  }>;
  total_expenses: number;
  calculation_date: string;
};

export function BalancesPanel({ divvyId }: BalancesPanelProps) {
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!divvyId) return;

    async function load() {
      const sp = new URLSearchParams(window.location.search);
      const from = sp.get('from') || '';
      const to = sp.get('to') || '';
      const q = new URLSearchParams();
      if (from) q.set('from', from);
      if (to) q.set('to', to);

      const res = await fetch(`/api/groups/${divvyId}/balances?${q.toString()}`);
      const payload = await res.json();
      setData(payload as BalancesResponse);
      setLoading(false);
    }

    load();
  }, [divvyId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!data) {
    return <div className="text-sm text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-4">
        {data.member_balances?.length || 0} membros
      </div>
      
      <div className="space-y-2">
        {data.member_balances?.map((member) => (
          <div key={member.user_id} className={`p-4 rounded-lg border ${
            member.net_balance > 0 ? 'bg-green-50 border-green-200' : 
            member.net_balance < 0 ? 'bg-red-50 border-red-200' : 
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-900">{member.full_name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
                <div className="text-xs text-gray-400">Função: {member.role}</div>
              </div>
              <div className={`text-right font-bold ${
                member.net_balance > 0 ? 'text-green-600' : 
                member.net_balance < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                <div>
                  {member.net_balance > 0 ? 'Lhe devem' : 
                   member.net_balance < 0 ? 'Você deve' : 'Ajustado'}
                </div>
                <div className="text-lg">
                  R$ {Math.abs(member.net_balance).toFixed(2)}
                </div>
                <div className="text-sm">
                  Pagou: R$ {member.total_paid.toFixed(2)}
                </div>
                <div className="text-sm">
                  Deve: R$ {member.total_owes.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-400 mt-4">
        Última atualização: {new Date(data.calculation_date).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
