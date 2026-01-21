'use client';

import { useEffect, useMemo, useState } from 'react';

type Member = { userid: string; email: string; role: string };

type SplitRow = {
  userid: string;
  amountCents: number;
};

type Mode = 'equal' | 'manual';

export function SplitsEditor({
  divvyId,
  expenseId,
  totalCents,
  members,
  initialSplits,
  onSaved,
}: {
  divvyId: string;
  expenseId: string;
  totalCents: number;
  members: Member[];
  initialSplits: Array<{ userid: string; amount_cents: number }>;
  onSaved: () => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>('equal');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<SplitRow[]>([]);
  const [saving, setSaving] = useState(false);

  const membersById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((x) => m.set(x.userid, x.email));
    return m;
  }, [members]);

  // Inicializa seleção e rows a partir dos splits existentes (se tiver)
  useEffect(() => {
    if (!members.length) return;

    const nextSelected: Record<string, boolean> = {};
    const nextRows: SplitRow[] = [];

    if (initialSplits?.length) {
      initialSplits.forEach((s) => {
        nextSelected[s.userid] = true;
        nextRows.push({ userid: s.userid, amountCents: s.amount_cents });
      });
      setMode('manual'); // se já existe split, faz sentido começar em manual
    } else {
      // default: todos selecionados
      members.forEach((m) => (nextSelected[m.userid] = true));
    }

    setSelected(nextSelected);
    setRows(nextRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

  const selectedUserIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );

  const manualMap = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.userid, r.amountCents));
    return map;
  }, [rows]);

  const manualSum = useMemo(() => {
    let sum = 0;
    for (const uid of selectedUserIds) sum += manualMap.get(uid) ?? 0;
    return sum;
  }, [selectedUserIds, manualMap]);

  function toggleUser(uid: string) {
    setSelected((prev) => ({ ...prev, [uid]: !prev[uid] }));
  }

  function applyEqualPreview() {
    const n = selectedUserIds.length;
    if (n <= 0) return;

    const base = Math.floor(totalCents / n);
    const remainder = totalCents - base * n;

    setRows(
      selectedUserIds.map((uid, idx) => ({
        userid: uid,
        amountCents: base + (idx < remainder ? 1 : 0),
      }))
    );
    setMode('manual'); // equal gera valores, então vira manual editável
  }

  function setManual(uid: string, valueBRL: string) {
    // aceita "12,34" ou "12.34"
    const normalized = valueBRL.replace(',', '.').trim();
    const num = Number(normalized);
    const cents = Number.isFinite(num) ? Math.round(num * 100) : 0;

    setRows((prev) => {
      const others = prev.filter((p) => p.userid !== uid);
      return [...others, { userid: uid, amountCents: Math.max(0, cents) }].sort(
        (a, b) => a.userid.localeCompare(b.userid)
      );
    });
  }

  async function save() {
    if (!selectedUserIds.length) return alert('Selecione pelo menos 1 participante.');

    setSaving(true);

    if (mode === 'equal') {
      // envia modo equal (server calcula)
      const res = await fetch(`/api/groups/${divvyId}/expenses/${expenseId}/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'equal', userIds: selectedUserIds }),
      });
      const data = await res.json();
      setSaving(false);
      if (!res.ok) return alert(data.error ?? 'Erro ao salvar splits');
      await onSaved();
      return;
    }

    // manual: valida soma == total
    // garante que todos selecionados tenham linha
    const payloadSplits = selectedUserIds.map((uid) => ({
      userid: uid,
      amountCents: manualMap.get(uid) ?? 0,
    }));

    const sum = payloadSplits.reduce((acc, s) => acc + s.amountCents, 0);
    if (sum !== totalCents) {
      setSaving(false);
      return alert(
        `A soma dos splits (${formatBRL(sum)}) deve ser igual ao total (${formatBRL(totalCents)}).`
      );
    }

    const res = await fetch(`/api/groups/${divvyId}/expenses/${expenseId}/splits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'manual', splits: payloadSplits }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return alert(data.error ?? 'Erro ao salvar splits');
    await onSaved();
  }

  return (
    <div className="border rounded p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">Divisão (splits)</div>
        <div className="text-sm">
          Total: <b>{formatBRL(totalCents)}</b>
        </div>
      </div>

      {/* Participantes */}
      <div className="space-y-2">
        <div className="text-sm opacity-70">Participantes</div>
        <div className="grid gap-2 md:grid-cols-2">
          {members.map((m) => (
            <label key={m.userid} className="border rounded px-3 py-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!selected[m.userid]}
                onChange={() => toggleUser(m.userid)}
              />
              <span className="truncate">{m.email}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Modo */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          className={`border rounded px-3 py-1 ${mode === 'equal' ? 'font-semibold' : 'opacity-80'}`}
          onClick={() => setMode('equal')}
          type="button"
        >
          Igual (server)
        </button>

        <button
          className={`border rounded px-3 py-1 ${mode === 'manual' ? 'font-semibold' : 'opacity-80'}`}
          onClick={() => setMode('manual')}
          type="button"
        >
          Manual
        </button>

        <button
          className="border rounded px-3 py-1"
          onClick={applyEqualPreview}
          type="button"
          disabled={!selectedUserIds.length}
          title="Gera valores iguais (com arredondamento) e deixa editável"
        >
          Gerar igual (editável)
        </button>
      </div>

      {/* Editor manual */}
      {mode === 'manual' && (
        <div className="space-y-2">
          <div className="text-sm opacity-70">
            Ajuste manual (soma atual: <b>{formatBRL(manualSum)}</b>)
          </div>

          <div className="space-y-2">
            {selectedUserIds.map((uid) => {
              const email = membersById.get(uid) ?? uid;
              const cents = manualMap.get(uid) ?? 0;
              return (
                <div key={uid} className="border rounded p-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{email}</div>
                    <div className="text-xs opacity-70">{uid}</div>
                  </div>
                  <input
                    className="border rounded px-3 py-2 w-36 text-right"
                    defaultValue={(cents / 100).toFixed(2).replace('.', ',')}
                    onBlur={(e) => setManual(uid, e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              );
            })}
          </div>

          <div className="text-xs opacity-70">
            Dica: clique em “Gerar igual (editável)” e só ajuste pequenas diferenças.
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button className="border rounded px-4 py-2" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar splits'}
        </button>
      </div>
    </div>
  );
}

function formatBRL(cents: number) {
  const v = (cents / 100).toFixed(2).replace('.', ',');
  return `R$ ${v}`;
}
