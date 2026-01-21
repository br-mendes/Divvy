'use client';

import { useEffect, useMemo, useState } from 'react';
import { Notice } from '@/components/common/Notice';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

type Category = {
  id: string;
  divvyid: string;
  name: string;
  slug: string | null;
  icon: string | null;
  color: string | null;
  sortorder: number;
  isarchived: boolean;
  createdat: string;
  updatedat: string;
};

type NoticeState =
  | { type: 'success' | 'error' | 'info'; message: string }
  | null;

function friendlyError(raw: any) {
  const msg = String(raw?.error ?? raw?.message ?? raw ?? 'Erro inesperado');

  // Postgres unique constraint (comum para UNIQUE(divvyid,name))
  if (msg.toLowerCase().includes('duplicate key') || msg.toLowerCase().includes('unique')) {
    return 'Já existe uma categoria com esse nome neste grupo.';
  }

  // RLS / permissão
  if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('rls') || msg.toLowerCase().includes('forbidden')) {
    return 'Você não tem permissão para executar essa ação.';
  }

  return msg;
}

export function CategoriesPanel({ divvyId }: { divvyId: string }) {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeState>(null);

  const [showArchived, setShowArchived] = useState(false);

  // create
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#64748B');
  const [creating, setCreating] = useState(false);

  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#64748B');

  // row busy (prevenir spam de clique)
  const [busyId, setBusyId] = useState<string | null>(null);

  // confirm delete
  const [confirm, setConfirm] = useState<{ open: boolean; cat?: Category }>({ open: false });

  const sorted = useMemo(() => {
    return items.slice().sort((a, b) => {
      const ao = a.sortorder ?? 0;
      const bo = b.sortorder ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  const active = useMemo(() => sorted.filter((x) => !x.isarchived), [sorted]);
  const archived = useMemo(() => sorted.filter((x) => x.isarchived), [sorted]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/groups/${divvyId}/categories`);
    const data = await res.json();
    if (res.ok) setItems(data.categories ?? []);
    else setNotice({ type: 'error', message: friendlyError(data) });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function createCategory() {
    const name = newName.trim();
    if (!name) {
      setNotice({ type: 'error', message: 'Informe um nome para a categoria.' });
      return;
    }

    setCreating(true);
    setNotice(null);

    const res = await fetch(`/api/groups/${divvyId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        color: newColor || null,
        sortorder: (sorted[sorted.length - 1]?.sortorder ?? 0) + 10,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setNotice({ type: 'error', message: friendlyError(data) });
      return;
    }

    setNewName('');
    setNewColor('#64748B');
    setNotice({ type: 'success', message: 'Categoria criada.' });
    await load();
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color ?? '#64748B');
    setNotice(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditColor('#64748B');
  }

  async function saveEdit(categoryId: string) {
    const name = editName.trim();
    if (!name) {
      setNotice({ type: 'error', message: 'O nome não pode ser vazio.' });
      return;
    }

    setBusyId(categoryId);
    setNotice(null);

    const res = await fetch(`/api/groups/${divvyId}/categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: editColor || null }),
    });

    const data = await res.json();
    setBusyId(null);

    if (!res.ok) {
      setNotice({ type: 'error', message: friendlyError(data) });
      return;
    }

    cancelEdit();
    setNotice({ type: 'success', message: 'Categoria atualizada.' });
    await load();
  }

  async function toggleArchive(c: Category) {
    setBusyId(c.id);
    setNotice(null);

    const res = await fetch(`/api/groups/${divvyId}/categories/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isarchived: !c.isarchived }),
    });
    const data = await res.json();

    setBusyId(null);

    if (!res.ok) {
      setNotice({ type: 'error', message: friendlyError(data) });
      return;
    }

    setNotice({
      type: 'success',
      message: c.isarchived ? 'Categoria desarquivada.' : 'Categoria arquivada.',
    });
    await load();
  }

  async function removeCategoryConfirmed(c: Category) {
    setBusyId(c.id);
    setNotice(null);

    const res = await fetch(`/api/groups/${divvyId}/categories/${c.id}`, { method: 'DELETE' });
    const data = await res.json();

    setBusyId(null);

    if (!res.ok) {
      setNotice({ type: 'error', message: friendlyError(data) });
      return;
    }

    setNotice({ type: 'success', message: 'Categoria excluída.' });
    await load();
  }

  async function move(categoryId: string, dir: 'up' | 'down') {
    // Reordena só ativas (produto melhor)
    const list = active;
    const idx = list.findIndex((x) => x.id === categoryId);
    if (idx < 0) return;

    const swapWith = dir === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= list.length) return;

    const a = list[idx];
    const b = list[swapWith];

    // Otimista: já troca na UI para ficar instantâneo
    setItems((prev) => {
      const next = prev.slice();
      const ia = next.findIndex((x) => x.id === a.id);
      const ib = next.findIndex((x) => x.id === b.id);
      if (ia >= 0 && ib >= 0) {
        const tmp = next[ia].sortorder;
        next[ia] = { ...next[ia], sortorder: next[ib].sortorder };
        next[ib] = { ...next[ib], sortorder: tmp };
      }
      return next;
    });

    setBusyId(categoryId);
    setNotice(null);

    // swap no backend (2 PATCH)
    const r1 = await fetch(`/api/groups/${divvyId}/categories/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortorder: b.sortorder }),
    });
    const d1 = await r1.json();
    if (!r1.ok) {
      setBusyId(null);
      setNotice({ type: 'error', message: friendlyError(d1) });
      await load(); // rollback real
      return;
    }

    const r2 = await fetch(`/api/groups/${divvyId}/categories/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortorder: a.sortorder }),
    });
    const d2 = await r2.json();
    setBusyId(null);

    if (!r2.ok) {
      setNotice({ type: 'error', message: friendlyError(d2) });
      await load();
      return;
    }

    setNotice({ type: 'success', message: 'Ordem atualizada.' });
    await load();
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      {notice && (
        <Notice type={notice.type} message={notice.message} onClose={() => setNotice(null)} />
      )}

      {/* Create */}
      <div className="border rounded p-4 space-y-2">
        <div className="font-semibold">Criar categoria</div>

        <div className="grid gap-2 md:grid-cols-3 items-end">
          <div className="md:col-span-2">
            <div className="text-xs opacity-70 mb-1">Nome</div>
            <input
              className="border rounded px-3 py-2 w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Mercado"
              onKeyDown={(e) => {
                if (e.key === 'Enter') createCategory();
              }}
            />
          </div>

          <div>
            <div className="text-xs opacity-70 mb-1">Cor</div>
            <input
              className="border rounded px-3 py-2 w-full"
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              aria-label="Cor da categoria"
            />
          </div>

          <button
            className="border rounded px-4 py-2 md:col-span-3"
            onClick={createCategory}
            disabled={creating}
            type="button"
          >
            {creating ? 'Criando...' : 'Adicionar'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Mostrar arquivadas
          </label>

          <button className="border rounded px-3 py-1" onClick={load} type="button">
            Recarregar
          </button>
        </div>
      </div>

      {/* Active */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Categorias ativas</div>

        {active.length === 0 ? (
          <div className="opacity-70">Nenhuma categoria ativa.</div>
        ) : (
          <div className="space-y-2">
            {active.map((c) => {
              const isEditing = editingId === c.id;
              const rowBusy = busyId === c.id;

              return (
                <div key={c.id} className="border rounded p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: c.color ?? '#64748B' }}
                      aria-hidden
                    />
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="border rounded px-3 py-2"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(c.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <input
                          className="border rounded px-3 py-2"
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          aria-label="Cor da categoria"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs opacity-70">ordem: {c.sortorder}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="border rounded px-3 py-1"
                      onClick={() => move(c.id, 'up')}
                      title="Subir"
                      type="button"
                      disabled={rowBusy || !!editingId}
                    >
                      ↑
                    </button>
                    <button
                      className="border rounded px-3 py-1"
                      onClick={() => move(c.id, 'down')}
                      title="Descer"
                      type="button"
                      disabled={rowBusy || !!editingId}
                    >
                      ↓
                    </button>

                    {isEditing ? (
                      <>
                        <button
                          className="border rounded px-3 py-1"
                          onClick={() => saveEdit(c.id)}
                          type="button"
                          disabled={rowBusy}
                        >
                          {rowBusy ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button className="border rounded px-3 py-1" onClick={cancelEdit} type="button">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="border rounded px-3 py-1"
                          onClick={() => startEdit(c)}
                          type="button"
                          disabled={!!editingId}
                        >
                          Editar
                        </button>
                        <button
                          className="border rounded px-3 py-1"
                          onClick={() => toggleArchive(c)}
                          type="button"
                          disabled={rowBusy || !!editingId}
                        >
                          {rowBusy ? '...' : 'Arquivar'}
                        </button>
                        <button
                          className="border rounded px-3 py-1"
                          onClick={() => setConfirm({ open: true, cat: c })}
                          type="button"
                          disabled={rowBusy || !!editingId}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Archived */}
      {showArchived && (
        <div className="border rounded p-4 space-y-3">
          <div className="font-semibold">Arquivadas</div>

          {archived.length === 0 ? (
            <div className="opacity-70">Nenhuma categoria arquivada.</div>
          ) : (
            <div className="space-y-2">
              {archived.map((c) => {
                const rowBusy = busyId === c.id;

                return (
                  <div key={c.id} className="border rounded p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: c.color ?? '#64748B' }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs opacity-70">arquivada</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="border rounded px-3 py-1"
                        onClick={() => toggleArchive(c)}
                        type="button"
                        disabled={rowBusy || !!editingId}
                      >
                        {rowBusy ? '...' : 'Desarquivar'}
                      </button>
                      <button
                        className="border rounded px-3 py-1"
                        onClick={() => setConfirm({ open: true, cat: c })}
                        type="button"
                        disabled={rowBusy || !!editingId}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Excluir categoria"
        description={
          confirm.cat
            ? `Tem certeza que deseja excluir "${confirm.cat.name}"? Isso depende da policy (normalmente só o criador consegue).`
            : undefined
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        danger
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          const c = confirm.cat;
          setConfirm({ open: false });
          if (c) removeCategoryConfirmed(c);
        }}
      />

      <p className="text-xs opacity-70">
        Atalhos: no campo de edição, <b>Enter</b> salva e <b>Esc</b> cancela.
      </p>
    </div>
  );
}
