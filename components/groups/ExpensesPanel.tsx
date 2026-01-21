'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Category = {
  id: string;
  name: string;
  color?: string | null;
  isarchived?: boolean;
};

type ExpensesPanelProps = {
  children: ReactNode;
  categories: Category[];
  categoryId: string;
  setCategoryId: (value: string) => void;
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

export function ExpensesPanel({
  children,
  categories,
  categoryId,
  setCategoryId,
}: ExpensesPanelProps) {
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

      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Nova despesa</div>
        <div>
          <div className="text-xs opacity-70 mb-1">Categoria (opcional)</div>

          <div className="flex items-center gap-2">
            <div className="shrink-0">
              <ColorDot color={categories.find((c) => c.id === categoryId)?.color} />
            </div>

            <select
              className="border rounded px-3 py-2 w-full"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories
                .filter((c) => !c.isarchived)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
