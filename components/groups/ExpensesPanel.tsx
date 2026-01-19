'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ExpensesPanelProps = {
  children: ReactNode;
};

export function ExpensesPanel({ children }: ExpensesPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <button
          className="border rounded px-3 py-1"
          type="button"
          onClick={() => {
            const sp = new URLSearchParams(searchParams.toString());
            sp.set('tab', 'categories');
            router.replace(`${pathname}?${sp.toString()}`);
          }}
        >
          Gerenciar categorias
        </button>
      </div>
      {children}
    </div>
  );
}
