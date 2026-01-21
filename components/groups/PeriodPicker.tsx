'use client';

import { useMemo, useState } from 'react';
import { useGroupPeriod } from '@/components/groups/useGroupPeriod';

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function monthRangeISO(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const s = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const e = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return { s, e };
}

export function PeriodPicker() {
  const { from, to, setPeriod } = useGroupPeriod();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const presets = useMemo(() => {
    const cur = monthRangeISO(0);
    const prev = monthRangeISO(-1);
    const t = todayISO();

    // últimos 30 dias
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const last30 = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;

    return [
      { label: 'Mês atual', from: cur.s, to: cur.e },
      { label: 'Mês anterior', from: prev.s, to: prev.e },
      { label: 'Últimos 30 dias', from: last30, to: t },
      { label: 'Tudo', from: '', to: '' },
    ];
  }, []);

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="font-semibold">Período</div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            className="border rounded px-3 py-1 text-sm"
            onClick={() => setPeriod(p.from, p.to)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-3 items-end">
        <div>
          <div className="text-xs opacity-70 mb-1">De</div>
          <input
            className="border rounded px-3 py-2 w-full"
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Até</div>
          <input
            className="border rounded px-3 py-2 w-full"
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
          />
        </div>
        <button
          className="border rounded px-3 py-2"
          onClick={() => setPeriod(customFrom, customTo)}
          type="button"
        >
          Aplicar
        </button>
      </div>

      {(from || to) && (
        <div className="text-xs opacity-70">
          Aplicado: <b>{from || '...'}</b> até <b>{to || '...'}</b>
        </div>
      )}
    </div>
  );
}
